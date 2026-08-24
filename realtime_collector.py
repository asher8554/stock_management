# Synology Docker에서 KIS 실시간 체결을 수집해 Worker로 전달한다.
# KV 일일 쓰기 한도 보호를 위해 새 틱이 있을 때만, 최소 60초 간격으로 업로드한다.
import asyncio
import json
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from urllib.request import Request, urlopen

import websockets

KIS_API = "https://openapi.koreainvestment.com:9443"
WORKER_URL = os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/realtime"
SYMBOLS = [value.strip() for value in os.environ["KIS_SYMBOLS"].split(",") if value.strip()]
TICKS = defaultdict(lambda: deque(maxlen=3000))
UPLOAD_INTERVAL = 60.0


def request_json(url, body):
    request = Request(url, data=json.dumps(body).encode(), headers={"content-type": "application/json", "user-agent": "stock-management-realtime/1.0"})
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read())


def approval_key():
    return request_json(f"{KIS_API}/oauth2/Approval", {"grant_type": "client_credentials", "appkey": os.environ["KIS_APP_KEY"], "secretkey": os.environ["KIS_APP_SECRET"]})["approval_key"]


def upload():
    symbols = {symbol: list(ticks) for symbol, ticks in TICKS.items()}
    request = Request(WORKER_URL, data=json.dumps({"updatedAt": datetime.now(timezone.utc).isoformat(), "symbols": symbols}).encode(), headers={"authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json", "user-agent": "stock-management-realtime/1.0"}, method="POST")
    with urlopen(request, timeout=20):
        pass


def record(message):
    if not message.startswith("0|H0STCNT0|"):
        return False
    _, _, count, payload = message.split("|", 3)
    fields = payload.split("^")
    width = len(fields) // int(count)
    added = False
    for offset in range(0, len(fields), width):
        row = fields[offset:offset + width]
        if len(row) < 14:
            continue
        try:
            TICKS[row[0]].append({"time": f"{datetime.now().strftime('%Y%m%d')}T{row[1]}", "price": int(row[2]), "volume": int(row[12])})
            added = True
        except ValueError:
            continue
    return added


async def run():
    dirty = False
    last_upload = 0.0
    while True:
        try:
            async with websockets.connect(os.environ.get("KIS_WS_URL", "wss://ops.koreainvestment.com:21000/tryitout"), ping_interval=30) as socket:
                key = approval_key()
                for symbol in SYMBOLS:
                    await socket.send(json.dumps({"header": {"approval_key": key, "custtype": "P", "tr_type": "1", "content-type": "utf-8"}, "body": {"input": {"tr_id": "H0STCNT0", "tr_key": symbol}}}))
                while True:
                    try:
                        if record(await asyncio.wait_for(socket.recv(), timeout=10)):
                            dirty = True
                    except TimeoutError:
                        pass
                    now = time.monotonic()
                    if dirty and now - last_upload >= UPLOAD_INTERVAL:
                        upload()
                        dirty = False
                        last_upload = now
        except Exception as error:
            print(f"realtime reconnect: {error}", flush=True)
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(run())

# KIS 최근 1년 분봉을 날짜별로 Worker에 이어서 저장한다.
import os
import time
from datetime import datetime, timedelta
from urllib.parse import urlencode

from sync_portfolio import load_env, request_json


def day_bars(token, symbol, day):
    rows = {}
    cursor = "153000"
    for _ in range(10):
        query = urlencode({"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": symbol, "FID_INPUT_HOUR_1": cursor, "FID_INPUT_DATE_1": day, "FID_PW_DATA_INCU_YN": "Y", "FID_FAKE_TICK_INCU_YN": ""})
        data = request_json(f"https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-time-dailychartprice?{query}", headers={"authorization": f"Bearer {token}", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"], "tr_id": "FHKST03010230"})
        if data.get("rt_cd") != "0":
            raise RuntimeError(data.get("msg1", "한국투자증권 분봉 조회 실패"))
        page = data.get("output2", [])
        if not page:
            break
        for row in page:
            moment, price = row.get("stck_cntg_hour", ""), row.get("stck_prpr")
            if len(moment) == 6 and price:
                rows[f"{day}T{moment}"] = {"time": f"{day}T{moment}", "open": price, "high": price, "low": price, "close": price, "volume": row.get("cntg_vol", 0)}
        earliest = min((row.get("stck_cntg_hour", "") for row in page), default="")
        if len(page) < 120 or earliest <= "090000":
            break
        cursor = earliest
        time.sleep(.4)
    return list(rows.values())


def main():
    load_env()
    token = request_json("https://openapi.koreainvestment.com:9443/oauth2/tokenP", method="POST", headers={"content-type": "application/json"}, json_body={"grant_type": "client_credentials", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"]})["access_token"]
    url = os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/intraday"
    for symbol in [value.strip() for value in os.environ.get("KIS_SYMBOLS", "237350").split(",") if value.strip()]:
        for offset in range(366):
            day = (datetime.now().astimezone().date() - timedelta(days=offset)).strftime("%Y%m%d")
            bars = day_bars(token, symbol, day)
            if bars:
                request_json(url, method="POST", headers={"Authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json"}, json_body={"symbol": symbol, "bars": bars, "append": True})
            time.sleep(.4)


if __name__ == "__main__":
    main()

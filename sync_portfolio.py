# 한국투자증권과 토스증권의 읽기 전용 잔고를 로컬에서 동기화한다.
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def load_env(path=Path(".env")):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key and not key.lstrip().startswith("#"):
            os.environ[key.strip()] = value.strip()


def request_json(url, method="GET", headers=None, form=None, json_body=None):
    data = json.dumps(json_body).encode() if json_body is not None else urlencode(form).encode() if form else None
    request = Request(url, data=data, headers={"User-Agent": "stock-management-sync/1.0", **(headers or {})}, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read())
    except HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"{error.code} {url}: {detail}") from error


def kis_snapshot(data):
    summary = data["output2"][0]
    return {"provider": "kis", "items": [{
        "symbol": item.get("pdno"), "name": item.get("prdt_name"), "currency": "KRW", "quantity": item.get("hldg_qty"), "lastPrice": item.get("prpr"), "averagePurchasePrice": item.get("pchs_avg_pric"), "marketValue": item.get("evlu_amt"),
    } for item in data["output1"] if item.get("hldg_qty") != "0"], "marketValue": summary.get("tot_evlu_amt"), "cash": summary.get("dnca_tot_amt"), "stockValue": summary.get("scts_evlu_amt")}


def kis_daily_bars(token, symbol):
    end = datetime.now().astimezone().date()
    start = "19900101"
    cursor = end.strftime("%Y%m%d")
    rows = []
    while cursor >= start:
        query = urlencode({"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": symbol, "FID_INPUT_DATE_1": start, "FID_INPUT_DATE_2": cursor, "FID_PERIOD_DIV_CODE": "D", "FID_ORG_ADJ_PRC": "0"})
        data = request_json(f"https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?{query}", headers={"authorization": f"Bearer {token}", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"], "tr_id": "FHKST03010100"})
        if data.get("rt_cd") != "0":
            raise RuntimeError(data.get("msg1", "한국투자증권 일봉 조회 실패"))
        page = data.get("output2", [])
        if not page:
            break
        rows.extend(page)
        oldest = page[-1].get("stck_bsop_date", "")
        if len(page) < 100 or not oldest or oldest <= start:
            break
        cursor = (datetime.strptime(oldest, "%Y%m%d").date() - timedelta(days=1)).strftime("%Y%m%d")
        time.sleep(.15)
    unique = {row.get("stck_bsop_date"): row for row in rows}
    return [{"time": row.get("stck_bsop_date"), "open": row.get("stck_oprc"), "high": row.get("stck_hgpr"), "low": row.get("stck_lwpr"), "close": row.get("stck_clpr"), "volume": row.get("acml_vol")} for _, row in sorted(unique.items())]


def kis_trades(token, account, product, symbol):
    end = datetime.now().astimezone().date()
    split = end - timedelta(days=90)
    trades = {}
    for side, direction in (("buy", "02"), ("sell", "01")):
        for tr_id, start, finish in (("TTTC0081R", split.strftime("%Y%m%d"), end.strftime("%Y%m%d")), ("CTSC9215R", "19900101", (split - timedelta(days=1)).strftime("%Y%m%d"))):
            query = urlencode({"CANO": account, "ACNT_PRDT_CD": product, "INQR_STRT_DT": start, "INQR_END_DT": finish, "SLL_BUY_DVSN_CD": direction, "PDNO": symbol, "CCLD_DVSN": "01", "INQR_DVSN": "00", "INQR_DVSN_3": "00", "ORD_GNO_BRNO": "", "ODNO": "", "INQR_DVSN_1": "", "CTX_AREA_FK100": "", "CTX_AREA_NK100": "", "EXCG_ID_DVSN_CD": "KRX"})
            try:
                data = request_json(f"https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/inquire-daily-ccld?{query}", headers={"authorization": f"Bearer {token}", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"], "tr_id": tr_id, "custtype": "P"})
            except RuntimeError:
                continue
            for row in data.get("output1", []):
                date = row.get("ord_dt", ""); price = row.get("avg_prvs") or row.get("avg_ccld_prc") or row.get("ord_unpr"); quantity = row.get("tot_ccld_qty") or row.get("ccld_qty") or row.get("ord_qty")
                if len(date) == 8 and price and quantity:
                    trades[f"{side}:{date}:{row.get('odno', '')}"] = {"date": date, "price": price, "quantity": quantity, "side": side}
    return list(trades.values())


def kis_account():
    token = request_json("https://openapi.koreainvestment.com:9443/oauth2/tokenP", method="POST", headers={
        "content-type": "application/json",
    }, json_body={"grant_type": "client_credentials", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"]})["access_token"]
    account = os.environ["KIS_ACCOUNT_NO"]
    product = os.environ.get("KIS_ACCOUNT_PRODUCT_CODE", "01")
    query = urlencode({"CANO": account, "ACNT_PRDT_CD": product, "AFHR_FLPR_YN": "N", "OFL_YN": "N", "INQR_DVSN": "02", "UNPR_DVSN": "01", "FUND_STTL_ICLD_YN": "N", "FNCG_AMT_AUTO_RDPT_YN": "N", "PRCS_DVSN": "00", "CTX_AREA_FK100": "", "CTX_AREA_NK100": ""})
    data = request_json(f"https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/inquire-balance?{query}", headers={
        "authorization": f"Bearer {token}", "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"], "tr_id": "TTTC8434R", "custtype": "P",
    })
    if data.get("rt_cd") != "0":
        raise RuntimeError(data.get("msg1", "한국투자증권 잔고 조회 실패"))
    snapshot = kis_snapshot(data)
    for item in snapshot["items"]:
        item["bars"] = kis_daily_bars(token, item["symbol"])
        item["trades"] = kis_trades(token, account, product, item["symbol"])
    return snapshot


def krx_metric(url, name_field, name, value_field, unit):
    for days_ago in range(1, 8):
        date = (datetime.now().astimezone().date() - timedelta(days=days_ago)).strftime("%Y%m%d")
        rows = request_json(f"{url}?{urlencode({'basDd': date})}", headers={"AUTH_KEY": os.environ["KRX_API_KEY"]}).get("OutBlock_1", [])
        item = next((row for row in rows if row.get(name_field) == name), None)
        if item:
            return {"value": item[value_field], "asOf": item["BAS_DD"], "source": "KRX", "unit": unit}
    raise RuntimeError(f"KRX {name} 데이터를 찾지 못했습니다.")


def krx_snapshot():
    return {"updatedAt": datetime.now(timezone.utc).isoformat(), "metrics": {
        "kospi100": krx_metric(os.environ["KRX_KOSPI_API_URL"], "IDX_NM", "코스피 100", "CLSPRC_IDX", "pt"),
        "gold": krx_metric(os.environ["KRX_GOLD_API_URL"], "ISU_NM", "금 99.99_1kg", "TDD_CLSPRC", "원/g"),
    }}


def main():
    load_env()
    if not os.environ.get("KIS_APP_KEY"):
        raise RuntimeError("KIS_APP_KEY 환경변수가 필요합니다.")
    snapshot = {"updatedAt": datetime.now(timezone.utc).isoformat(), "accounts": [kis_account()]}
    url = os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/snapshot"
    request_json(url, method="POST", headers={"Authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json"}, json_body=snapshot)
    request_json(os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/market/krx", method="POST", headers={"Authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json"}, json_body=krx_snapshot())


if __name__ == "__main__":
    main()

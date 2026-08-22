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


def toss_credentials():
    return (
        os.environ.get("TOSS_CLIENT_ID") or os.environ["TOSS_CLIENT_KEY"],
        os.environ.get("TOSS_CLIENT_SECRET") or os.environ["TOSS_SECRET_KEY"],
    )


def holding_item(item):
    return {key: item.get(key) for key in ("symbol", "name", "marketCountry", "currency", "quantity", "lastPrice", "averagePurchasePrice")} | {"marketValue": item.get("marketValue", {}).get("amount")}


def request_json(url, method="GET", headers=None, form=None, json_body=None):
    data = json.dumps(json_body).encode() if json_body is not None else urlencode(form).encode() if form else None
    request = Request(url, data=data, headers={"User-Agent": "stock-management-sync/1.0", **(headers or {})}, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read())
    except HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        raise RuntimeError(f"{error.code} {url}: {detail}") from error


def toss_account():
    client_id, client_secret = toss_credentials()
    token = request_json("https://openapi.tossinvest.com/oauth2/token", method="POST", form={
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    })["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    accounts = request_json("https://openapi.tossinvest.com/api/v1/accounts", headers=headers)["result"]
    account = next((item for item in accounts if item["accountType"] == "BROKERAGE"), None)
    if not account:
        raise RuntimeError("토스증권 BROKERAGE 계좌를 찾지 못했습니다.")
    holdings = request_json("https://openapi.tossinvest.com/api/v1/holdings", headers={
        **headers, "X-Tossinvest-Account": str(account["accountSeq"]),
    })["result"]
    return {
        "provider": "toss",
        "items": [holding_item(item) for item in holdings["items"]],
        "marketValue": holdings["marketValue"],
    }


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
    accounts = []
    if os.environ.get("TOSS_CLIENT_ID") or os.environ.get("TOSS_CLIENT_KEY"):
        accounts.append(toss_account())
    if os.environ.get("KIS_APP_KEY"):
        accounts.append(kis_account())
    if not accounts:
        raise RuntimeError("TOSS_CLIENT_ID 또는 KIS_APP_KEY 환경변수가 필요합니다.")
    snapshot = {"updatedAt": datetime.now(timezone.utc).isoformat(), "accounts": accounts}
    url = os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/snapshot"
    request_json(url, method="POST", headers={"Authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json"}, json_body=snapshot)
    request_json(os.environ["PORTFOLIO_INGEST_URL"].rstrip("/") + "/v1/market/krx", method="POST", headers={"Authorization": f"Bearer {os.environ['PORTFOLIO_INGEST_TOKEN']}", "content-type": "application/json"}, json_body=krx_snapshot())


if __name__ == "__main__":
    main()

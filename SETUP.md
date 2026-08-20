# 개인 API 연결 설정

## 1. Cloudflare Access

Cloudflare Dashboard에서 `Workers & Pages` > `stock-management-private-api` > `Access`를 연다.

`Protect this Worker`를 선택하고 Google 로그인 방식을 추가한다. Allow 정책에는 이메일 `asher8554@gmail.com`만 넣는다. 이 설정이 끝날 때까지 로컬 동기화를 실행하지 않는다.

## 2. 수집 토큰

PowerShell에서 아래 명령을 실행한다. 토큰 값은 직접 입력하고 채팅·저장소·환경변수 목록 출력에 넣지 않는다.

```powershell
npx wrangler secret put INGEST_TOKEN
```

같은 값을 현재 사용자 환경변수 `PORTFOLIO_INGEST_TOKEN`에 저장한다. Worker 주소는 아래 값이다.

```text
https://stock-management-private-api.household-account-asher.workers.dev
```

## 3. 증권사 읽기 전용 키

한국투자증권에는 현재 PC의 공인 IP를, 토스증권 WTS의 Open API 허용 IP 관리에도 같은 IP를 등록한다. 각 증권사에서 읽기 전용 키를 발급한 뒤 현재 사용자 환경변수에만 설정한다.

```text
TOSS_CLIENT_ID
TOSS_CLIENT_SECRET
KIS_APP_KEY
KIS_APP_SECRET
KIS_ACCOUNT_NO
KIS_ACCOUNT_PRODUCT_CODE
PORTFOLIO_INGEST_URL
PORTFOLIO_INGEST_TOKEN
```

`PORTFOLIO_INGEST_URL`에는 Worker 주소까지만 넣는다. `sync_portfolio.py`가 `/v1/snapshot`을 붙인다.

## 4. 첫 동기화와 1분 실행

```powershell
python .\sync_portfolio.py
```

성공한 뒤 Windows 작업 스케줄러에서 `python E:\Github\stock_management\sync_portfolio.py`를 1분마다 실행한다. 동기화 실패 시 마지막 정상 스냅샷이 유지된다.

## 제한

현재 한국투자증권 연동은 국내주식 잔고 조회만 구현한다. 해외주식 잔고는 공식 API 명세와 계좌 권한을 확인한 뒤 추가한다.

# 컨텍스트 노트

- 2026-08-21: 새 프로젝트 루트에 기존 `AGENTS.md`가 없어 새로 생성한다.
- 2026-08-21: 요청한 예전 Ponytail 경로가 없어서 설치된 `4.9.0` 경로를 사용한다.
- 2026-08-21: `AGENTS.md` UTF-8 엄격 디코드와 필수 복구·언어 정책 문구 검증을 통과했다.
- 2026-08-21: 사용자 요청은 한국투자증권·토스증권 계좌, 핵심 지표, 분산 현황, 비교 차트를 포함한 GitHub Pages 대시보드의 PRD 작성이다.
- 2026-08-21: GitHub Pages는 정적 호스팅이므로 계좌 API 키와 보유내역 자동 연동을 클라이언트에 넣지 않는다. MVP는 브라우저 로컬 가져오기, 자동 동기화는 인증된 개인 백엔드로 분리한다.
- 2026-08-21: 비교 차트는 직접 데이터를 넣을 수 있는 TradingView Lightweight Charts를 기본으로 정했다. TradingView 위젯은 사용자 데이터 연결이 불가해 보조 용도다.
- 2026-08-21: `PRD.md`는 UTF-8 엄격 디코드, 필수 지표·도넛·차트·보안·완료 기준 문구, `git diff --check`를 통과했다.
- 2026-08-21: 사용자는 공개 GitHub Pages를 유지하되 한국투자증권·토스증권 API로 계좌를 자동 조회하고, 시장 지표는 1분 단위 갱신을 원한다. 목표 비중과 분산 경고는 직접 설정 가능해야 한다.
- 2026-08-21: 지표 공급은 계좌 API의 실제 종목 지원·공개 재배포 약관을 먼저 확인한다. 불허 시 공개 캐시 대신 허용된 위젯 또는 유료 라이선스 공급원을 사용한다.
- 2026-08-21: `PRD.md` 보완 후 UTF-8 엄격 디코드, 보안 구조·1분 갱신·일별 미국채·100% 편집기·분산 경고 필수 문구, `git diff --check`를 통과했다.
- 2026-08-21: API 키를 GitHub Pages 비밀번호 입력이나 5초 숨김 화면에 저장하지 않는다. 5초 길게 누르기는 개인 연결 입구일 뿐이고, 실제 보호는 Cloudflare Access의 비공개 허용 이메일이다.
- 2026-08-21: 정적 UI는 `index.html`·`styles.css`·`app.mjs`로 구현했다. 목표 비중 변경은 나머지 항목을 비례 조정해 항상 100%다. `node --test tests/allocation.test.mjs`, `node --check`, UTF-8, `git diff --check`를 통과했다. 브라우저 시각 검증은 `agent-browser` 미설치로 생략했다.
- 2026-08-21: 사용자 승인으로 Cloudflare Worker와 Access 실제 연결을 시작한다. 증권사 키는 채팅이나 저장소에 기록하지 않고 Cloudflare Secret 입력 단계에서만 다룬다.
- 2026-08-21: `wrangler whoami`가 만료된 인증 토큰을 보고했다. `wrangler login`으로 기본 브라우저 OAuth를 열었으나 아직 승인되지 않아 Worker 배포와 Access 설정을 진행할 수 없다.
- 2026-08-21: Cloudflare OAuth 로그인은 개인 계정으로 완료됐다. 다만 Workers의 고정 송신 IP는 Enterprise 전용이라 증권사 API가 IP 허용목록을 요구하면 일반 Worker 직접 호출은 안정적으로 구성할 수 없다. 이 경우 사용자 PC에서 동기화한 뒤 Worker로 읽기 전용 스냅샷을 전송하는 구조가 필요하다.
- 2026-08-21: 로컬 Python 동기화기가 토스증권 전체 보유종목과 한국투자증권 국내주식 잔고를 조회해 Worker KV로 전송하도록 작성했다. 개인 API 조회는 Cloudflare Access의 비공개 이메일 설정으로 제한하며, Access 설정 권한은 현재 OAuth 토큰에 없어 대시보드에서 한 번 설정해야 한다.
- 2026-08-21: KV namespace `PORTFOLIO_CACHE`와 Worker `stock-management-private-api`를 배포했다. `/health`는 200, Access 없는 `/v1/portfolio`는 403이다. Worker는 아직 Access 정책과 `INGEST_TOKEN`이 없으므로 스냅샷을 수집하지 않는다.
- 2026-08-21: 공개 파일·Worker 변수에서 개인 이메일을 제거하고 다크 테마를 적용했다. `ALLOWED_EMAIL` Secret이 없거나 Access 인증이 없으면 `/v1/portfolio`가 403인지 배포 환경에서 확인했다. 기존 공개 Git 커밋에는 이메일이 남아 있어 이력 재작성은 사용자 확인이 필요하다.
- 2026-08-21: 사용자 스크린샷에서 native dialog의 기본 전경색이 검정으로 렌더링된 것을 확인했다. 다크 모달에 명시적 전경색, 배경색, 고대비 버튼, 버튼 묶음을 적용한다.
## 2026-08-21 우준우 계좌 현황

- 토스증권 Open API는 `client_id`와 `client_secret`으로 토큰을 발급하고, 잔고 조회에는 `X-Tossinvest-Account`가 필요하다.
- 공개 GitHub Pages는 GitHub 로그인 뒤 Worker의 `/v1/portfolio` 응답만 표시한다. 계좌·종목 데이터는 공개 정적 파일에 넣지 않는다.
- 현재 `.env`에는 Worker 수집용 `PORTFOLIO_INGEST_URL`과 `PORTFOLIO_INGEST_TOKEN`이 없어 실제 스냅샷 전송은 보류한다.
- 관리자 진입 길게 누르기 시간을 5초에서 3초로 줄였다.
- `python .\sync_portfolio.py` 실행은 토스증권 `/oauth2/token`에서 HTTP 403으로 중단됐다. 공식 명세상 허용 IP 미등록 응답에 해당하므로 WTS Open API 허용 IP 등록이 필요하다.
- 허용 IP 등록 후 토스증권 조회는 통과했다. Worker `/v1/snapshot`은 Python 기본 User-Agent에서 Cloudflare 1010으로 차단됐지만 curl POST는 Worker의 정상 401을 받았다. 수집 요청에 명시적 User-Agent가 필요하다.
- 명시적 User-Agent 적용 후 Worker는 정상 도달했으나 `/v1/snapshot`이 401 `unauthorized`를 반환했다. Worker `INGEST_TOKEN`과 로컬 `PORTFOLIO_INGEST_TOKEN` 값이 일치하지 않는다.
- `.env`의 수집 토큰을 Worker Secret으로 재업로드하고 Worker를 재배포했지만 401이 유지됐다. 외부 요청에서 Authorization 헤더가 누락되는지와 Secret 값 불일치를 구분하는 비밀 비노출 진단이 필요하다.
- 비밀 비노출 진단 결과 Authorization 헤더는 Worker까지 도달하며 상태는 `mismatch`였다. Worker Secret과 `.env` 값이 확실히 다르므로 사용자가 Dashboard에서 `.env` 값을 그대로 다시 입력해야 한다.
- Cloudflare Dashboard에서 `INGEST_TOKEN`을 `.env` 값과 다시 맞춘 뒤 `python .\sync_portfolio.py`가 오류 없이 완료됐다. Worker 스냅샷 저장이 성공했다.
# 2026-08-21 KIS switch
- User chose own Korea Investment & Securities account. Required KIS variables exist locally; values were not read or logged. Next: run sync and verify safely.
# 2026-08-21 KIS sync diagnosis
- `python .\sync_portfolio.py` reached Worker ingestion and received `401 unauthorized` at `/v1/snapshot`. KIS token and balance calls completed first, so the failing boundary is the local ingestion token versus Worker `INGEST_TOKEN`, not the KIS account credentials.
# 2026-08-21 KIS integration complete
- Root cause of repeated Worker `401`: stale process environment won over `.env`; `load_env()` now gives `.env` priority. A direct Wrangler pipe also appended a line ending, so the Worker secret was finally uploaded with a direct Node stdin write preserving the complete value. Safe auth probe returned `400 invalid_snapshot`, then real sync succeeded. Remote KV has one KIS account with one holding; private dashboard rendered it. UI labels were updated from the previous child-account wording to the user's own account and Korean Investment & Securities.
# 2026-08-21 KIS account title
- User clarified that the private account heading must be 한국투자증권 계좌, not a child's name or a generic personal-account label.
# 2026-08-21 actual allocation and market metrics
- User approved a split design: authenticated KIS cash/stock allocation, plus public delayed KRX and daily FRED market metrics through a cached Worker endpoint. Real-time KRX data is excluded because it requires separate licensing.
# 2026-08-21 KRX endpoint clarification
- KRX sample requests require a category path before the API ID, so `KRX_KOSPI_API_ID` and `KRX_GOLD_API_ID` alone cannot form a request URL. A safe schema probe returned HTTP 404. Require each service's full sample URL, excluding the AUTH_KEY value.
# 2026-08-21 KRX authorization state
- The configured KRX authentication key has the expected non-secret shape, but KRX returned HTTP 401 for both sample and service URL forms. The service application is not usable yet; check API service utilization approval before implementation.
# 2026-08-21 KRX authorization verified
- After service approval, both configured KRX routes returned HTTP 200. Responses were empty because the daily services require request-date fields. The configured KOSPI 100 and gold services are daily data APIs, so the UI must not present them as real-time or intraday delayed data.
# 2026-08-21 actual allocation and market deployment
- KIS summary field names were checked without values. `dnca_tot_amt` is cash, `tot_evlu_amt` is total account value, and `scts_evlu_amt` is stock value. A new KIS sync successfully ingested the extended snapshot.
- `/v1/market` is public and cached in KV. FRED daily S&P 500 and US Treasury values are live. The configured KRX key currently returns HTTP 401 for both daily endpoints, so KOSPI 100 and gold render `인증 필요` instead of stale or invented values.
# 2026-08-22 actual allocation correction
- `tot_evlu_amt` is total account value, not stock-only value. Actual allocation must use `dnca_tot_amt` for cash and `scts_evlu_amt` for securities value. The private UI renders the corrected values below holdings as a cash/stock donut.

# 2026-08-22 GitHub callback auto load
- The existing private portfolio loader is reused after a `github-auth` URL fragment is stored in session storage, so a successful GitHub OAuth return immediately fetches and renders the authenticated snapshot.
- The manual load button was removed because the OAuth callback now performs the same fetch.

# 2026-08-22 FRED API
- FRED graph CSV returned HTTP 520 to Cloudflare Worker egress. The Worker now calls the authenticated FRED observations API, which returns recent observations in JSON.

# 2026-08-22 KRX Worker diagnosis
- The same KRX key returns HTTP 200 with rows from the local machine but HTTP 401 from Cloudflare Worker, even after the Worker secret was synchronized. KRX data must be fetched from the approved local machine and uploaded to the Worker. The configured index service supplies `KRX 100`, not a `코스피 100` row.

# 2026-08-22 KRX local ingestion
- The user replaced the KOSPI service URL. The new local response includes a `코스피 100` row. `sync_portfolio.py` uploads the two local KRX metrics through an authenticated Worker endpoint; the public market endpoint merges those delayed KRX values with FRED values.

# 2026-08-22 settings page
- Goal allocation and guardrail inputs moved to `settings.html`. Both use browser local storage; the main page now reads the allocation and shows only a horizontal summary bar.

# 2026-08-22 glass redesign
- The dashboard now uses Pretendard and a shared dark glass surface system. Market cards, target allocation, portfolio details, settings inputs, and the dialog retain their existing semantics while adopting the new visual language.

# 2026-08-22 glass consistency
- Both routes now request the same refreshed shared stylesheet revision. Target-allocation labels use `white-space: nowrap` so `방어자산 0%` stays on one line.

# 2026-08-22 header icon and allocation labels
- The supplied lower-left portfolio-card image was isolated into `assets/portfolio-mark.png` and used by both header marks. Target-bar segments now center their percentage labels regardless of allocation class.

# 2026-08-22 TradingView analysis page
- User approved the free Advanced Chart widget path. It will provide TradingView's own indicator and drawing UI. The page will persist only its own selected symbol, interval, and watchlist in browser local storage because the hosted iframe does not expose full chart-layout persistence to the application.
- `analysis.html` now loads the public Advanced Chart widget with both toolbars enabled. `analysis.mjs` stores only `symbol`, `interval`, and `watchlist` under `stock-management-analysis-v1` and rebuilds the iframe after page-owned changes.
- Deployment verification passed for `analysis.html` and `analysis.mjs`; the public TradingView widget script returned HTTP 200.
- TradingView's widget returned its licensing-only-symbol message for `KRX:237350`. The analysis default now uses `NASDAQ:AAPL`; the old saved KODEX symbol is normalized away and receives an inline explanation if entered again.

# 2026-08-22 target bar alignment
- The previous target-bar center rule lost the cascade to the shared actual-allocation selector. The target bar now uses an ID-scoped selector so each percentage remains centered inside its own segment.

# 2026-08-22 holding analysis page
- User removed the external chart requirement. `analysis.html` now uses KIS daily bars from the authenticated private portfolio snapshot and a native SVG chart. It shows average purchase price, current price, 20/60-day moving averages, volume, and RSI(14). The balance API does not include an order date, so the purchase reference is the average purchase price line.
- Analysis initially used a nonexistent Worker subdomain. It must use the same `stock-management-private-api.household-account-asher.workers.dev` endpoint as `app.mjs`; the live endpoint health check is 200 and unauthenticated private data is 403.
- Analysis now distinguishes missing login, HTTP failure, missing daily bars, malformed snapshots, and rendering failures. The rendered error contains no account values or credentials.
- Range controls use trading-day counts: 1D=1, 1W=5, 1M=22, 1Y=252, 5Y=1260, and 전체=all synced bars. KIS daily-bar ingestion requests five years so 120-day and long-period views have enough history.

# 2026-08-22 real-time holding analysis
- User approved a Synology Docker collector. KIS credentials remain in Synology environment variables. The collector sends only bounded, derived trade bars to the existing authenticated Worker; Pages receives them only after GitHub OAuth.
- The collector uses KIS domestic real-time trade `H0STCNT0`, obtains the WebSocket approval key locally, bounds each symbol to 3,000 recent ticks, and posts derived ticks to `/v1/realtime` with the existing ingestion token.

# 2026-08-22 chart unit controls
- The NAS container is `Up`; the analysis page can now consume its existing authenticated `/v1/realtime` route. Intraday units will aggregate those stored ticks in the browser, keeping the Worker storage format unchanged.
- `node --test tests/analysis.test.mjs tests/worker.test.mjs` passes, including minute aggregation and displayed time formatting.

# 2026-08-22 local sync removal
- The user removed the Windows `StockManagementPortfolioSync` task and `run_sync_portfolio.cmd`. Synology Docker remains the only active collection process.

# 2026-08-22 chart unit rendering correction
- Daily charts appeared normal while non-daily selections overlapped because SVG candle and volume widths were fixed at 4px and 6px regardless of visible bar count. Width must follow available horizontal spacing.

# 2026-08-22 full daily history
- The previous collector used one KIS daily-price call with a 1,826-day start. The KIS endpoint returns at most 100 rows per response, so `전체` must page backward from the most recent returned date to the first available date.
- The one-time full-history `python sync_portfolio.py` run completed successfully and uploaded the updated private snapshot.

# 2026-08-22 real-time timestamp correction
- Synology reports Saturday, 2026-08-22 KST, so no new domestic-market trades can arrive now. The collector also used an uncertain payload field as its date; normalize every tick with the collector's current `YYYYMMDD` plus the official `HHMMSS` field.
- The user rebuilt the Synology container after the corrected collector source was copied.

# 2026-08-22 daily moving averages on higher units
- Weekly and monthly candles should stay aggregated, but their MA lines must be sampled from daily 20/60/120 values, not recalculated as 20/60/120 weeks or months.
- The dedicated weekly sampling test passes with the final 20-day value carried to the latest weekly candle.

# 2026-08-22 historical minute and hour charts
- Tick and second charts remain live-only. A private Worker endpoint stores backfilled KIS minute bars separately; the browser loads them only when the minute or hour unit is selected.

# 2026-08-22 private login entry
- The fifth header-mark click now redirects straight to the existing GitHub OAuth endpoint. The OAuth callback retains its existing session-storage and automatic private-portfolio loading flow.

# 2026-08-22 intraday storage recovery
- The original append endpoint merged every prior minute bar on each daily upload, causing Cloudflare Worker error 1102 during the one-year backfill. Minute bars now use one KV key per symbol and trade date; the authenticated read route merges those small chunks only when the analysis page requests them.

# 2026-08-22 scrollable technical chart
- The chart keeps the existing approximately 120-candle viewport. Wider histories increase the SVG width and use the existing horizontal overflow container; automatic refresh preserves the viewed distance from the latest candle.

# 2026-08-22 fixed chart references
- The price axis and moving-average legend are sibling overlays of the scrolling SVG. Price levels stay on the right, and the 20/60/120 colors stay at the upper left for minute and hour views.

# 2026-08-22 OAuth write-limit recovery
- Cloudflare KV reported `KV put() limit exceeded for the day`, causing 1101 failures for both real-time ingestion and GitHub OAuth state writes. OAuth state now uses a secure, HttpOnly, SameSite cookie with a ten-minute expiry, so login does not consume KV writes.

# 2026-08-22 viewport price scaling
- The chart reads its horizontal scroll position, selects only the candles in view for the price range, and redraws on the next animation frame. The fixed right-axis labels therefore match the displayed historical window.

# 2026-08-22 purchase-history markers
- The KIS balance response has no execution dates. `sync_portfolio.py` now reads completed buy executions through KIS `inquire-daily-ccld` for each active domestic holding and stores date, execution price, and quantity in the private snapshot. The native chart marks that date and price with a gold `매수` marker, including its price in the visible-window scale.

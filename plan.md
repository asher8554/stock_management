# 주식 관리 대시보드 PRD 계획

1. 공개 파일과 Worker 설정에서 관리자 이메일을 제거한다.
2. 공개 대시보드를 다크 테마로 전환한다.
3. Worker를 재배포하고 공개 산출물에서 식별자가 없는지 검증한다.
4. 공개 Git 이력 정리 필요 여부를 사용자에게 확인한다.
# 2026-08-21 우준우 계좌 현황

1. 토스증권 Open API 환경 변수명을 기존 동기화 경로에 연결한다. 검증: 표준 라이브러리 테스트.
2. 비공개 포트폴리오에 계좌·보유 종목을 표시한다. 검증: 행 변환 테스트와 Node 구문 검사.
# KIS account switch

1. Run KIS sync. Verify: worker ingestion success.
2. Read private snapshot safely. Verify: KIS item count.
3. Load private dashboard. Verify: holdings table appears.
# Actual allocation and market metrics

1. Extend the KIS snapshot with cash and stock value. Verify: actual allocation sums to 100.
2. Add the cached market endpoint. Verify: source-specific timestamps and fallback values.
3. Render private actual allocation and public metrics. Verify: browser UI shows both.

# GitHub callback auto load

1. Reuse private portfolio loader after GitHub OAuth callback. Verify: callback token triggers authenticated portfolio request.

# FRED API market data

1. Replace Worker graph fetch with authenticated FRED observations API. Verify: all three U.S. metrics return FRED values.

# KRX market data

1. Fetch KRX from the approved local machine and upload a delayed market snapshot. Verify: Worker serves the uploaded KRX values.

# Settings page

1. Move allocation and guardrail controls to a dedicated page. Verify: settings persist locally and main page renders a read-only target bar.

# Glass redesign

1. Apply a Pretendard glassmorphism visual system to the main and settings pages. Verify: shared styles load on both routes.

# Glass consistency

1. Keep the shared glass stylesheet current across both routes and prevent target labels wrapping. Verify: both documents request the same stylesheet revision and the defense label has no-wrap styling.

# Header icon and allocation labels

1. Replace both header marks with the supplied portfolio image and center all target-bar labels. Verify: shared image asset is used by both headers and each target segment centers its percentage.

# Holding analysis page

1. Upload KIS holding daily bars and render average purchase price, current price, moving averages, volume, and RSI privately. Verify: the analysis route has no external chart dependency.

# Real-time holding analysis

1. Run a KIS real-time trade collector in Synology Docker and ingest bounded tick history into the authenticated Worker. Verify: no broker credentials reach Pages.
2. Extend the analysis route with tick, second, minute, hour, day, week, and month units. Verify: every moving average uses the selected bar unit.

# Chart unit controls

1. Read authenticated real-time ticks with existing Worker route. Verify: missing stream leaves daily chart usable.
2. Aggregate selected unit in browser and calculate 20/60/120 over resulting bars. Verify: unit change changes the MA source.
3. Render compact time labels along x-axis. Verify: timestamps remain readable on all units.

# Chart unit rendering correction

1. Scale candle and volume widths to the visible bar count. Verify: tick and long-range charts no longer overlap into a solid block.

# Full daily history

1. Page KIS daily responses backward to the instrument's first available day. Verify: stored bars exceed the previous five-year window.

# Real-time timestamp correction

1. Build each KIS trade timestamp from the collector date and HHMMSS payload. Verify: client timestamp parser accepts tick records.

# Daily moving averages on higher units

1. Sample daily 20/60/120 moving averages at weekly and monthly candle boundaries. Verify: weekly and monthly legends remain day-based.

# Historical minute and hour charts

1. Fetch one KIS trading day at a time and append it privately. Verify: completed dates remain stored if a later request fails.
2. Use stored minute data only for minute and hour views. Verify: tick and second views stay live-only.

# Private login entry

1. Start GitHub OAuth on the fifth mark click. Verify: OAuth callback still triggers the existing portfolio load.

# Scrollable technical chart

1. Preserve candle size and extend the SVG width by bar count. Verify: overflowing history scrolls horizontally without shrinking candles.
2. Preserve the viewer's horizontal position on automatic refresh. Verify: live refresh does not jump the viewed period.

# Fixed chart references

1. Keep the price axis and moving-average legend outside the horizontal scroll layer. Verify: both remain visible while viewing historical bars.

# OAuth write-limit recovery

1. Keep OAuth state out of KV. Verify: the login route responds with a 302 and a secure state cookie when KV writes are exhausted.

# Viewport price scaling

1. Recalculate the price range from bars visible after horizontal scrolling. Verify: right price labels and candle height adapt to the viewed window.

# Purchase-history markers

1. Read completed KIS buy executions into the private portfolio snapshot. Verify: each active holding receives dated purchase events.
2. Draw those events on the native chart. Verify: daily and aggregated charts place markers at the matching purchase period.

# Hover crosshair

1. Draw a dotted vertical line at the hovered candle. Verify: it follows the pointer across the chart and hides on exit.

# Bollinger bands

1. Add 20-period, 2-standard-deviation bands to the price pane. Verify: visible bands expand the price scale and show in the legend.

# Hover price tooltip

1. Show hovered candle date and close price near the pointer. Verify: tooltip moves with the dotted guide and hides on exit.

# Daily purchase runway

1. Show how many one-share daily orders current cash funds at the held stock's current price. Verify: cash divided by last price is rounded down to days.

# Hover crosshair horizontal guide

1. Extend the hover guide with a horizontal dotted line. Verify: both axes follow the pointer.

# Fixed price-label alignment

1. Pin average and current price labels to their own dotted-price coordinates. Verify: higher price renders above lower price.

# Target-cash purchase runway

1. Reserve the configured target cash percentage before calculating daily one-share purchases. Verify: only cash above the reserve funds orders.

# Portfolio returns

1. Show holding cost-basis cumulative return and latest 252-trading-day return in the private account header. Verify: unavailable one-year history displays a dash.

# Chart control row

1. Place unit controls and range controls on one desktop row. Verify: units are left aligned and ranges right aligned.

# Price-label collision spacing

1. Keep adjacent fixed price labels at least 22px apart. Verify: current and average labels remain readable when prices are close.

# Portfolio summary cards

1. Replace the two return cards with five compact holding-summary cards. Verify: cost basis, market value, profit, cumulative return, and annual return appear together.

# Portfolio summary row

1. Use the full private-account width for the five summary cards. Verify: desktop shows all cards on one row.

# Portfolio summary header placement

1. Place five desktop cards in the account header's unused right space. Verify: holdings remain directly below the account heading.

# Account-wide summary totals

1. Include cash with held stocks in cost basis, value, profit, and cumulative return. Verify: each total represents the full account.

# Account annual return integrity

1. Remove the stock-price annual return from the account summary. Verify: annual return stays unavailable until account cash flows are present.

# Account performance baseline

1. Save the current cash plus stock-cost total as a browser baseline. Verify: future cumulative and annualized returns use that fixed baseline.

# Data-backed yearly return

1. Show the current calendar-year return only when the saved baseline and current data belong to the same year. Verify: years without data render no yearly card.

# Buy and sell markers

1. Fetch buy and sell executions and render one color-coded legend without overlapping text labels. Verify: daily chart shows colored trade dots and guides.

# Yearly returns page

1. Add a private page that groups available holding daily bars by calendar year and shows one return card per year. Verify: the page states that cash and cash flows are excluded.

# 2026-08-23 전반 최적화·리팩토링

1. 근거 있는 죽은 코드를 제거한다. 대상: `sync_portfolio.py kis_intraday_bars`(호출부 없음), `analysis.mjs annualReturn`(UI 제거된 잔재). 검증: node --test, py_compile.
2. 분석 차트 핫패스를 최적화한다. 단위 집계와 지표 계산을 데이터 버전·단위별로 캐시하고, 뷰포트 스케일을 객체 includes 대신 인덱스 범위로 계산하며, 보이는 창이 변하지 않으면 SVG 재생성을 건너뛴다. 검증: 기존 차트 테스트 유지.
3. `API_BASE` 중복(app·analysis·returns)을 하나의 공유 모듈로 모은다. 검증: node --check, 테스트.
4. 미추적 로그·캐시 산출물을 정리하고 .gitignore에 패턴을 추가한다. 검증: git status.
5. 사용자 확인이 필요한 항목은 질문 뒤에만 진행한다. 대상: 토스증권 연동 제거 여부, `icon` 원본 이미지 삭제 여부.
6. 완료 후 `$project-hardening-docs`로 인계한다.

# 2026-08-29 보안 보완

1. `.env`가 Git에서 무시되고 추적·전체 이력에 없는지 확인한다. 검증: `git check-ignore -v .env`, `git ls-files -- .env .env.*`, `git log --all -- .env`.
2. Worker 수집 인증을 Web Crypto HMAC 검증으로 바꾸고, 고정 OAuth callback·보안 응답 헤더·명시적 CORS 메서드를 적용한다. 검증: `node --test tests/*.test.mjs`.
3. Worker를 배포했고 health·무인증 차단·CORS preflight을 확인했다. 정상 OAuth와 NAS 수집은 다음 운영 확인에서 검증한다. 키 회전은 Cloudflare와 Synology 값을 같은 작업 창에 교체한 뒤에만 수행한다.

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

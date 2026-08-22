# 작업 체크리스트

- [x] 현재 프로젝트 설정 파일 상태 확인
- [x] 컨텍스트 압축 복구 규칙 및 언어 정책 추가
- [x] UTF-8 및 필수 문구 검증
- [x] 계좌·시장 데이터·차트 제공 방식 조사
- [x] PRD 초안 작성
- [x] 문서·UTF-8 검증 및 커밋
- [x] 공개 Pages·개인 API·1분 갱신 제약 조사
- [x] PRD의 보안 구조와 자산배분 편집기 보완
- [x] 문서·UTF-8 검증 및 커밋
- [x] 공개 페이지·개인 API 보안 요구사항 확정
- [x] 정적 대시보드와 목표 비중 편집기 구현
- [x] 개인 연결 입구와 보안 안내 구현
- [x] 정적 페이지 검증 및 커밋
- [x] Cloudflare 인증 상태 확인
- [x] Worker 읽기 전용 API와 1분 갱신 구현
- [ ] Access 허용 이메일과 API 비밀값 설정
- [x] Worker 배포 검증 및 커밋
- [x] 공개 파일·Worker 설정의 관리자 이메일 제거
- [x] 다크 테마 적용
- [x] 재배포·공개 산출물 검증
- [ ] 공개 Git 이력 정리 여부 확인
## 2026-08-21 우준우 계좌 현황

- [x] 토스증권 Open API 환경 변수 호환
- [x] 비공개 계좌·보유 종목 표시
- [x] 테스트·구문·공개 노출 여부 검증
- [x] Worker 수집 URL·토큰 설정 후 실제 동기화
- [x] 토스증권 WTS 허용 IP 등록 후 동기화 재시도
- [x] 관리자 진입 길게 누르기 3초 변경
# KIS account switch
- [x] KIS credentials configured locally.
- [ ] Run KIS portfolio sync and verify snapshot.
- [ ] Verify private dashboard renders holdings.
# KIS sync result
- [x] KIS account fetch completed before worker ingestion.
- [ ] Align Worker `INGEST_TOKEN` with local `PORTFOLIO_INGEST_TOKEN`.
# KIS integration complete
- [x] Store one KIS account with one holding in Worker KV.
- [x] Verify private dashboard renders the holding.
- [x] Label the account and KIS provider correctly.
# KIS account title
- [x] Rename the private account title to 한국투자증권 계좌.
# Actual allocation and market metrics
- [x] Design approved.
- [x] Design specification written.
- [x] User reviews the specification.
- [x] KRX service authorization verified.
- [x] Implement KIS actual allocation.
- [x] Implement market data cache and UI.
- [ ] Resolve KRX API authentication response for KOSPI 100 and gold.
- [x] Upload local KRX KOSPI 100 and gold snapshots to the Worker.
- [x] Configure authenticated FRED observations API for U.S. metrics.

# GitHub callback auto load
- [x] Automatically load private holdings after GitHub OAuth callback.
- [x] Remove the redundant manual portfolio-load button.

# Settings page
- [x] Add a dedicated target-allocation and guardrail settings page.
- [x] Replace main-page controls with a read-only horizontal allocation bar.

# Glass redesign
- [x] Apply Pretendard and a glassmorphism visual system to both pages.

# Glass consistency
- [x] Use the same refreshed glass stylesheet on both pages.
- [x] Keep target allocation labels on one line.

# Header icon and allocation labels
- [x] Use the supplied portfolio image for both header icons.
- [x] Center all target-allocation percentage labels.

# TradingView analysis page
- [x] Approve the Advanced Chart widget design and local persistence scope.
- [x] Add the analysis route and shared navigation.
- [x] Implement local selection and watchlist persistence.
- [x] Validate, deploy, and verify the route.

# TradingView widget compatibility
- [x] Replace the unavailable KODEX 코스피100 default with a widget-supported symbol.
- [x] Reset the previously saved unavailable default and show a clear inline message.

# Target bar alignment
- [x] Give target-bar segments a selector that overrides actual-allocation alignment.

# Holding analysis page
- [x] Remove the Advanced Chart widget, saved watchlist, and widget-specific documentation.
- [x] Add KIS daily-bar ingestion for held domestic stocks.
- [x] Render average purchase price, current price, 20/60-day moving averages, volume, and RSI(14).
- [x] Run the KIS sync and validate the deployed analysis route.
- [x] Show actionable private-data and rendering failures instead of a generic chart error.
- [x] Add range selectors and a 120-day moving average to holding analysis.

# Real-time holding analysis
- [x] Add authenticated Worker storage for bounded real-time bars.
- [x] Add a Synology Docker KIS WebSocket collector.
- [x] Add chart-unit controls, time axis, and unit-based 20/60/120 moving averages.
- [x] Validate locally and prepare Synology deployment.

# Full daily history
- [x] Page KIS daily history to the first available date and upload it.

# Real-time timestamp correction
- [x] Normalize KIS real-time tick timestamps and redeploy the Synology collector.

# Daily moving averages on higher units
- [x] Keep weekly and monthly candles while using 20/60/120-day moving averages.

# Historical minute and hour charts
- [ ] Store up to one year of KIS minute bars privately and use them for minute/hour charts.

# Private login entry
- [x] Start GitHub OAuth automatically after the fifth header-mark click.

# Scrollable technical chart
- [x] Keep the chart viewport stable and scroll full history horizontally.
- [x] Preserve the viewed position during automatic refresh.

# Fixed chart references
- [x] Keep price labels and moving-average colors visible during horizontal scrolling.

# OAuth write-limit recovery
- [x] Move temporary GitHub OAuth state from KV to a secure, short-lived cookie.

# Viewport price scaling
- [x] Auto-scale the price range and fixed price labels to the horizontally visible bars.

# Purchase-history markers
- [x] Collect completed KIS buy executions for each active holding.
- [x] Render each execution date and price as a chart marker.

# Unit-switch price scaling
- [x] Calculate price scale from the target horizontal position after a unit change.

# Price axis and MACD
- [x] Show current price and average purchase price on the fixed right price axis.
- [x] Add a MACD 12·26·9 panel below RSI.

# MACD and time zoom
- [x] Expand the MACD panel for readable bars and lines.
- [x] Support persistent time-axis zoom with Shift+wheel.

# Daily purchase markers
- [x] Remove tick, second, minute, and hour chart controls and data reads.
- [x] Restrict purchase markers to the daily chart.

# Private portfolio location
- [x] Move private account summary, holdings, and actual allocation to analysis.
- [x] Redirect completed GitHub login to the analysis page.

# Analysis entry
- [x] Open analysis directly after five header-mark clicks and start GitHub login there when needed.

# Hover crosshair
- [x] Show a dotted vertical guide at the nearest hovered candle.

# Bollinger bands
- [x] Render 20-period, 2-standard-deviation bands behind price candles.

# Hover price tooltip
- [x] Show the nearest candle date and close price next to the pointer.

# Daily purchase runway
- [x] Show one-share-per-day purchase days from cash and the held stock's current price.

# Hover crosshair horizontal guide
- [x] Add a horizontal dotted line to the hover guide.

# Fixed price-label alignment
- [x] Align fixed average and current price labels to their price markers.

# Target-cash purchase runway
- [x] Exclude the configured target cash reserve from daily purchase days.

# Portfolio returns
- [x] Show cumulative holding return and one-year price return in the private account header.

# Chart control row
- [x] Align unit and range controls on one desktop row.

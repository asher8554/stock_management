# ?묒뾽 泥댄겕由ъ뒪??

- [x] ?꾩옱 ?꾨줈?앺듃 ?ㅼ젙 ?뚯씪 ?곹깭 ?뺤씤
- [x] 而⑦뀓?ㅽ듃 ?뺤텞 蹂듦뎄 洹쒖튃 諛??몄뼱 ?뺤콉 異붽?
- [x] UTF-8 諛??꾩닔 臾멸뎄 寃利?
- [x] 怨꾩쥖쨌?쒖옣 ?곗씠?걔룹감???쒓났 諛⑹떇 議곗궗
- [x] PRD 珥덉븞 ?묒꽦
- [x] 臾몄꽌쨌UTF-8 寃利?諛?而ㅻ컠
- [x] 怨듦컻 Pages쨌媛쒖씤 API쨌1遺?媛깆떊 ?쒖빟 議곗궗
- [x] PRD??蹂댁븞 援ъ“? ?먯궛諛곕텇 ?몄쭛湲?蹂댁셿
- [x] 臾몄꽌쨌UTF-8 寃利?諛?而ㅻ컠
- [x] 怨듦컻 ?섏씠吏쨌媛쒖씤 API 蹂댁븞 ?붽뎄?ы빆 ?뺤젙
- [x] ?뺤쟻 ??쒕낫?쒖? 紐⑺몴 鍮꾩쨷 ?몄쭛湲?援ы쁽
- [x] 媛쒖씤 ?곌껐 ?낃뎄? 蹂댁븞 ?덈궡 援ы쁽
- [x] ?뺤쟻 ?섏씠吏 寃利?諛?而ㅻ컠
- [x] Cloudflare ?몄쬆 ?곹깭 ?뺤씤
- [x] Worker ?쎄린 ?꾩슜 API? 1遺?媛깆떊 援ы쁽
- [ ] Access ?덉슜 ?대찓?쇨낵 API 鍮꾨?媛??ㅼ젙
- [x] Worker 諛고룷 寃利?諛?而ㅻ컠
- [x] 怨듦컻 ?뚯씪쨌Worker ?ㅼ젙??愿由ъ옄 ?대찓???쒓굅
- [x] ?ㅽ겕 ?뚮쭏 ?곸슜
- [x] ?щ같??룰났媛??곗텧臾?寃利?
- [ ] 怨듦컻 Git ?대젰 ?뺣━ ?щ? ?뺤씤
## 2026-08-21 ?곗???怨꾩쥖 ?꾪솴

- [x] ?좎뒪利앷텒 Open API ?섍꼍 蹂???명솚
- [x] 鍮꾧났媛?怨꾩쥖쨌蹂댁쑀 醫낅ぉ ?쒖떆
- [x] ?뚯뒪?맞룰뎄臾맞룰났媛??몄텧 ?щ? 寃利?
- [x] Worker ?섏쭛 URL쨌?좏겙 ?ㅼ젙 ???ㅼ젣 ?숆린??
- [x] ?좎뒪利앷텒 WTS ?덉슜 IP ?깅줉 ???숆린???ъ떆??
- [x] 愿由ъ옄 吏꾩엯 湲멸쾶 ?꾨Ⅴ湲?3珥?蹂寃?
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
- [x] Rename the private account title to ?쒓뎅?ъ옄利앷텒 怨꾩쥖.
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
- [x] Replace the unavailable KODEX 肄붿뒪??00 default with a widget-supported symbol.
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
- [x] Add a MACD 12쨌26쨌9 panel below RSI.

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

# Price-label collision spacing
- [x] Separate overlapping fixed price labels by at least 22px.

# Portfolio summary cards
- [x] Replace two return cards with cost, value, profit, cumulative return, and annual return cards.
- [x] Deploy and verify static bundle.

# Portfolio summary row
- [x] Place five desktop summary cards on one horizontal row.
- [x] Test, deploy, and verify static bundle.

# Portfolio summary header placement
- [x] Move five desktop cards to the empty header space.
- [x] Test, deploy, and verify static bundle.

# Account-wide summary totals
- [x] Include cash and stocks in account cost basis, value, profit, and cumulative return.
- [x] Test, deploy, and verify static bundle.

# Account annual return integrity
- [x] Remove non-account annual return and show the required account-history dependency.
- [x] Test, deploy, and verify static bundle.

# Account performance baseline
- [x] Save current cash plus stock cost as the future account-return baseline.
- [x] Test, deploy, and verify static bundle.

# Data-backed yearly return
- [x] Show only the calendar-year return when baseline and current data share a year.
- [x] Test, deploy, and verify static bundle.

# Buy and sell markers
- [x] Fetch buy and sell executions in the KIS snapshot.
- [x] Render color-coded dots and one legend entry per side.
- [x] Test, deploy, and verify static bundle.
- [x] Increase marker contrast and render trade guides above chart overlays.

# Yearly returns page
- [x] Add the authenticated yearly returns route and navigation.
- [x] Calculate holding daily-bar returns by calendar year.
- [x] Test, deploy, and verify the static bundle.
- [x] Open a year card to inspect per-holding dates, prices, and returns.

# 2026-08-23 ?꾨컲 理쒖쟻?붋룸━?⑺넗留?- [x] ?뚯뒪??湲곗????뺣낫 (node --test 18媛??듦낵, py_compile ?듦낵)
- [ ] sync_portfolio.py kis_intraday_bars ?쒓굅
- [ ] analysis.mjs annualReturn 諛??뚯뒪??assertion ?쒓굅
- [ ] 李⑦듃 吏??罹먯떆 + 酉고룷???몃뜳??踰붿쐞 怨꾩궛 + 遺덈? 李??ъ깮???앸왂
- [ ] pointermove DOM 荑쇰━ 罹먯떛
- [ ] API_BASE 怨듭쑀 紐⑤뱢 ?듯빀
- [ ] 濡쒓렇 ?곗텧臾??뺣━ 諛?.gitignore 媛깆떊
- [ ] ?ъ슜???뺤씤: ?좎뒪利앷텒 ?곕룞 ?쒓굅 ?щ?, icon ?뚯씪 ??젣 ?щ?
- [ ] ?꾩껜 寃利???project-hardening-docs ?멸퀎

# 2026-08-23 hardening-docs 인계
- [x] cso 일일 보안 검토 (시크릿·OAuth·세션·CORS 통과, XSS 수정, 수용 리스크 기록)
- [x] docs/project-hardening.html 최종 상태 문서 생성(Mermaid 포함)
- [ ] 커밋 여부는 사용자 결정 대기
- [x] 사용자 확정: 분봉 UI 미재개 → backfill_intraday.py·Worker /v1/intraday 제거, 테스트 404 전환
- [x] 실시간 수집기와 나머지 항목 그대로 수용

# 2026-08-25 정기 동기화와 KV 한도 수정
- [x] 원인 확정: 수집기 10초 무조건 업로드가 KV 일일 한도 소진 → 스냅샷 1101 (wrangler tail 증거)
- [x] 수집기 절전 수정(새 틱 시 + 최소 60초 간격) — 사용자 승인
- [x] Synology kis-daily-sync 서비스 추가(평일 16:30 KST) + 스케줄 테스트 4개
- [x] .env.realtime.example에 일일 동기화 필요 변수 문서화
- [ ] 사용자: Synology 파일 복사 + 컨테이너 재빌드
- [ ] 내일 아침(KV 리셋 후) 스냅샷 동기화 확인
- [x] CSO 점검 반영: F1 토큰 가드, F2 CSP, F3 wss, F4 non-root (사용자 승인 후 적용)
- [ ] worker 재배포 및 검증

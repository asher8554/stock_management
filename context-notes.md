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

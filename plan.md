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

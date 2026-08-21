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
- [ ] User reviews the specification.
- [ ] Implement KIS actual allocation.
- [ ] Implement market data cache and UI.

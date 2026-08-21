# 실제 보유 비중과 주요지표 연결 설계

## 목표

- KIS 계좌의 예수금과 국내주식 평가액으로 실제 현금·주식 비중을 표시한다.
- 공개 화면의 주요지표를 지연·일별 데이터로 연결하고 기준 시각을 명확히 표시한다.

## 범위

### 실제 보유 비중

- `sync_portfolio.py`는 KIS 잔고 응답에서 예수금과 종목별 평가액을 스냅샷에 저장한다.
- 비공개 계좌 영역과 목표비중 영역은 현금·주식 합계를 100%로 계산해 막대와 수치로 표시한다.
- 방어자산은 현재 KIS 국내주식 잔고만으로 분류하지 않으며 0%로 표시한다.
- 계좌·보유종목·예수금 원값은 기존 인증된 비공개 API에만 남긴다.

### 주요지표

- Worker는 공개 `GET /v1/market`을 제공하고, 캐시된 마지막 정상 응답을 반환한다.
- 페이지는 1분마다 이 엔드포인트를 다시 읽는다.
- KOSPI 100과 KRX 금현물은 KRX 공개 지연 데이터를 사용한다.
- S&P 500과 미국채 10년·30년은 FRED의 일별 `SP500`, `DGS10`, `DGS30` 데이터를 사용한다.
- 카드마다 값, 변동, 데이터 기준 시각, `지연` 또는 `일별` 출처를 표시한다.
- 새 수집이 실패하면 마지막 정상값과 마지막 갱신 시각을 유지한다.

## 구성

```text
KIS Open API -> sync_portfolio.py -> Worker KV private snapshot -> authenticated dashboard
KRX / FRED -> Worker market fetch + cache -> public /v1/market -> dashboard polling
```

## 보안과 제한

- KIS AppKey·AppSecret은 로컬 동기화에만 사용한다.
- 공개 주요지표 엔드포인트에는 계좌 정보나 인증값을 포함하지 않는다.
- KRX 데이터는 지연 데이터로만 표기한다. 실시간 데이터는 별도 라이선스 없이는 제공하지 않는다.

## 검증

- KIS 스냅샷의 예수금·평가액 매핑 단위 테스트.
- 실제 보유 비중 계산과 합계 100% 단위 테스트.
- 주요지표 응답 정규화·마지막 정상값 유지 단위 테스트.
- Worker 비공개 스냅샷 인증과 공개 시장지표 응답 테스트.
- 배포 후 비공개 보유 비중 및 공개 주요지표 화면 확인.

## 출처

- KRX Data Marketplace. https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd?locale=ko_KR
- FRED DGS10. https://fred.stlouisfed.org/series/DGS10
- FRED DGS30. https://fred.stlouisfed.org/series/DGS30
- FRED SP500. https://fred.stlouisfed.org/series/SP500

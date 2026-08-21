// 비공개 포트폴리오 종목 행 변환을 검증한다.
import assert from "node:assert/strict";
import { portfolioRows } from "../portfolio.mjs";

const rows = portfolioRows({ accounts: [{ provider: "toss", items: [{ name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", currency: "KRW" }] }] });

assert.deepEqual(rows, [{ provider: "토스증권", name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", currency: "KRW" }]);

const kisRows = portfolioRows({ accounts: [{ provider: "kis", items: [{ name: "KODEX 코스피100", symbol: "237350", quantity: "5", marketValue: "438975", currency: "KRW" }] }] });

assert.equal(kisRows[0].provider, "한국투자증권");

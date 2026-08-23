// 비공개 포트폴리오 종목 행 변환을 검증한다.
import assert from "node:assert/strict";
import { actualAllocation, portfolioRows, purchaseDays } from "../portfolio.mjs";

const kisRows = portfolioRows({ accounts: [{ provider: "kis", items: [{ name: "KODEX 코스피100", symbol: "237350", quantity: "5", marketValue: "5000", currency: "KRW", lastPrice: "1000", averagePurchasePrice: "800" }] }] });

assert.equal(kisRows[0].provider, "한국투자증권");
assert.equal(kisRows[0].gainRate, 25);
assert.equal(kisRows[0].gainAmount, 1000);

const unknownRows = portfolioRows({ accounts: [{ provider: "toss", items: [{ name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", currency: "KRW" }] }] });

assert.deepEqual(unknownRows, [{ provider: "toss", name: "삼성전자", symbol: "005930", quantity: "3", marketValue: "210000", lastPrice: undefined, averagePurchasePrice: undefined, gainRate: null, gainAmount: null, currency: "KRW" }]);

assert.deepEqual(actualAllocation({ accounts: [{ cash: "300", stockValue: "700" }] }), {
  cash: 300, stock: 700, defense: 0, cashPercent: 30, stockPercent: 70, defensePercent: 0,
});

assert.equal(purchaseDays(2661508, 87795), 30);
assert.equal(purchaseDays(2661508, 87795, 930145), 19);

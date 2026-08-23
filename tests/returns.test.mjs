// 연도별 수익률 계산을 검증하는 테스트
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDailyBars, yearlyReturns } from "../returns.mjs";

test("연도별 일봉 수익률을 계산한다", () => {
  const rows = yearlyReturns([{ averagePurchasePrice: 100, quantity: 1, bars: [{ time: "20250102", close: 100 }, { time: "20251230", close: 110 }, { time: "20260102", close: 110 }, { time: "20261230", close: 99 }] }]);
  assert.deepEqual(rows.map(({ year, returnRate }) => ({ year, returnRate })), [{ year: "2026", returnRate: -10 }, { year: "2025", returnRate: 10 }]);
});

test("잘못된 일봉은 제외한다", () => {
  assert.deepEqual(normalizeDailyBars([{ time: "bad", close: 100 }, { time: "20250101", close: 0 }]), []);
});

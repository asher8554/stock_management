// 보유종목 분석용 일봉 정규화와 기술지표 계산을 검증한다.
import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBars, rsi, sma } from "../analysis.mjs";

const bars = Array.from({ length: 15 }, (_, index) => ({ time: `202608${String(index + 1).padStart(2, "0")}`, open: 100 + index, high: 101 + index, low: 99 + index, close: 100 + index, volume: 1000 + index }));

test("일봉은 날짜순으로 정규화한다", () => {
  assert.equal(normalizeBars([...bars].reverse())[0].time, "20260801");
});

test("이동평균은 이전 기간이 부족하면 비운다", () => {
  const values = sma(bars, 5);
  assert.equal(values[3], null);
  assert.equal(values[4], 102);
});

test("상승 일봉 RSI는 100이다", () => {
  const values = rsi(bars, 14);
  assert.equal(values[13], null);
  assert.equal(values[14], 100);
});

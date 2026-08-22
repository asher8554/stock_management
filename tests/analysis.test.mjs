// 보유종목 분석용 일봉 정규화와 기술지표 계산을 검증한다.
import assert from "node:assert/strict";
import test from "node:test";
import { accountTotals, aggregateBars, annualReturn, barsForRange, bollinger, chartHoverIndex, chartScrollLeft, chartViewportBars, chartWidth, cumulativeReturn, indicatorValues, macd, normalizeBars, portfolioTotals, purchaseMarkers, purchaseMarkersForUnit, rsi, sma } from "../analysis.mjs";

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

test("기간 선택은 최근 거래일만 남긴다", () => {
  assert.equal(barsForRange(bars, "1W").length, 5);
  assert.equal(barsForRange(bars, "전체").length, 15);
});

test("weekly candles sample daily moving average", () => {
  const daily = Array.from({ length: 70 }, (_, index) => ({ time: `202606${String(index + 1).padStart(2, "0")}`, open: 100 + index, high: 101 + index, low: 99 + index, close: 100 + index, volume: 1 }));
  const weekly = aggregateBars(daily, "주");
  const values = indicatorValues(daily, weekly, "주", 20);
  assert.equal(values.at(-1), 159.5);
});

test("scrollable chart keeps the current viewport width then grows by bars", () => {
  assert.equal(chartWidth(120), 1080);
  assert.equal(chartWidth(121), 1088);
  assert.equal(chartWidth(240, 2) > chartWidth(240), true);
});

test("scroll position selects the price auto-scale bars", () => {
  const source = Array.from({ length: 240 }, (_, index) => ({ close: index }));
  assert.equal(chartViewportBars(source, 0, 1080)[0].close, 0);
  assert.equal(chartViewportBars(source, 960, 1080)[0].close > 100, true);
});

test("unit switch scales against its preserved chart position", () => {
  assert.equal(chartScrollLeft(240, 1080, 0), 960);
  assert.equal(chartScrollLeft(30, 1080, 960), 0);
});

test("purchase event is placed on its daily candle", () => {
  const source = [{ time: "20260820" }, { time: "20260821" }, { time: "20260822" }];
  assert.deepEqual(purchaseMarkers(source, [{ date: "20260821", price: 100, quantity: 5 }]), [{ date: "20260821", price: 100, quantity: 5, index: 1 }]);
  assert.deepEqual(purchaseMarkersForUnit("일", source, [{ date: "20260821", price: 100, quantity: 5 }]).map(({ index }) => index), [1]);
  assert.deepEqual(purchaseMarkersForUnit("주", source, [{ date: "20260821", price: 100, quantity: 5 }]), []);
});

test("MACD line, signal, histogram share the source length", () => {
  const values = macd(Array.from({ length: 40 }, (_, index) => ({ close: 100 + index })));
  assert.equal(values.line.length, 40);
  assert.equal(values.signal.at(-1) !== null && values.histogram.at(-1) !== null, true);
});

test("hover crosshair selects the nearest visible candle", () => {
  assert.equal(chartHoverIndex(120, 0, 58), 0);
  assert.equal(chartHoverIndex(120, 0, 59 + (chartWidth(120) - 113) / 119), 1);
});

test("bollinger bands use a 20-period mean and standard deviation", () => {
  const bands = bollinger(Array.from({ length: 20 }, () => ({ close: 100 })));
  assert.deepEqual(bands.at(-1), { upper: 100, middle: 100, lower: 100 });
});

test("account return and annual return use cost basis and 252 trading days", () => {
  assert.equal(cumulativeReturn([{ averagePurchasePrice: 100, quantity: 2, marketValue: 220 }]), 10);
  assert.deepEqual(portfolioTotals([{ averagePurchasePrice: 100, quantity: 2, marketValue: 220 }]), { cost: 200, value: 220 });
  assert.deepEqual(accountTotals({ accounts: [{ cash: 500, items: [{ averagePurchasePrice: 100, quantity: 2, marketValue: 220 }] }] }), { cost: 700, value: 720 });
  assert.equal(annualReturn(Array.from({ length: 253 }, (_, index) => ({ time: `2025${String(index).padStart(4, "0")}`, open: 100 + index, high: 100 + index, low: 100 + index, close: 100 + index }))), 252);
});

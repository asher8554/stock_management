// 분석 페이지의 저장 상태와 TradingView 종목 형식을 검증한다.
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { isTradingViewSymbol, normalizeAnalysisState, readAnalysisState } from "../analysis.mjs";

test("거래소가 포함된 TradingView 종목만 허용한다", () => {
  assert.equal(isTradingViewSymbol("KRX:237350"), true);
  assert.equal(isTradingViewSymbol("NASDAQ:AAPL"), true);
  assert.equal(isTradingViewSymbol("237350"), false);
});

test("잘못된 저장값은 기본값으로 정규화한다", () => {
  assert.deepEqual(normalizeAnalysisState({ symbol: "bad", interval: "X", watchlist: ["NASDAQ:AAPL", "bad"] }), {
    symbol: "KRX:237350",
    interval: "D",
    watchlist: ["NASDAQ:AAPL"],
  });
});

test("유효한 저장 상태를 읽는다", () => {
  const storage = { getItem: () => JSON.stringify({ symbol: "NASDAQ:AAPL", interval: "60", watchlist: ["NASDAQ:AAPL"] }) };
  assert.equal(readAnalysisState(storage).symbol, "NASDAQ:AAPL");
});

test("분석 경로와 공통 탐색 링크를 제공한다", () => {
  assert.match(fs.readFileSync("analysis.html", "utf8"), /id="chart-host"/);
  assert.match(fs.readFileSync("index.html", "utf8"), /href="analysis\.html"/);
  assert.match(fs.readFileSync("settings.html", "utf8"), /href="analysis\.html"/);
});

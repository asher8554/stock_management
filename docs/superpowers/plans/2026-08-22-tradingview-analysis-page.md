# TradingView Analysis Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public TradingView Advanced Chart analysis page that saves the user's selected symbol, interval, and watchlist locally.

**Architecture:** `analysis.html` contains the shared-header page shell and page-owned controls. `analysis.mjs` normalizes and persists state, validates `EXCHANGE:SYMBOL` values, and replaces the hosted TradingView widget when state changes. The iframe owns its technical-analysis toolbar and data.

**Tech Stack:** Static HTML, CSS, browser local storage, native ES modules, TradingView Advanced Chart widget.

**Spec:** `docs/superpowers/specs/2026-08-22-tradingview-analysis-design.md`

## Global Constraints

- Retain TradingView attribution and use only its public Advanced Chart widget script.
- Store only page-owned selections in browser local storage under `stock-management-analysis-v1`.
- Do not expose broker credentials, account holdings, or Worker secrets.
- Preserve the shared Pretendard glass UI and accessible focus behavior.

---

### Task 1: Analysis state module and tests

**Files:**
- Create: `analysis.mjs`
- Create: `tests/analysis.test.mjs`

**Interfaces:**
- Produces: `DEFAULT_ANALYSIS_STATE`, `normalizeAnalysisState(value)`, `isTradingViewSymbol(value)`, and `readAnalysisState(storage)`.
- Consumes: browser-compatible storage implementing `getItem(key)`.

- [ ] **Step 1: Write the failing test.**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isTradingViewSymbol, normalizeAnalysisState } from '../analysis.mjs';

test('accepts an exchange-qualified TradingView symbol', () => {
  assert.equal(isTradingViewSymbol('KRX:237350'), true);
  assert.equal(isTradingViewSymbol('237350'), false);
});

test('normalizes malformed persisted state to defaults', () => {
  assert.deepEqual(normalizeAnalysisState({ symbol: 'bad', interval: 'X', watchlist: ['NASDAQ:AAPL', 'bad'] }), {
    symbol: 'KRX:237350', interval: 'D', watchlist: ['NASDAQ:AAPL'],
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `node --test tests/analysis.test.mjs`

Expected: FAIL because `analysis.mjs` does not exist.

- [ ] **Step 3: Write the minimal state functions.**

```js
export const DEFAULT_ANALYSIS_STATE = { symbol: 'KRX:237350', interval: 'D', watchlist: ['KRX:237350'] };
export function isTradingViewSymbol(value) { return /^[A-Z0-9._-]+:[A-Z0-9._-]+$/i.test(String(value).trim()); }
export function normalizeAnalysisState(value) { /* return validated state with defaults */ }
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `node --test tests/analysis.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add analysis.mjs tests/analysis.test.mjs
git commit -m "분석 페이지 상태 저장 추가"
```

### Task 2: Page shell, navigation, and glass styling

**Files:**
- Create: `analysis.html`
- Modify: `index.html`
- Modify: `settings.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `assets/portfolio-mark.png`, `analysis.mjs`, and the shared stylesheet.
- Produces: `#analysis-form`, `#analysis-symbol`, `#analysis-interval`, `#watchlist`, `#chart-host`, and `#analysis-error` for `analysis.mjs`.

- [ ] **Step 1: Write static route assertions.**

```js
import fs from 'node:fs';
assert.match(fs.readFileSync('analysis.html', 'utf8'), /id="chart-host"/);
assert.match(fs.readFileSync('index.html', 'utf8'), /analysis\.html/);
assert.match(fs.readFileSync('settings.html', 'utf8'), /analysis\.html/);
```

- [ ] **Step 2: Run the assertions to verify they fail.**

Run: `node --test tests/analysis.test.mjs`

Expected: FAIL because the route and navigation link do not exist.

- [ ] **Step 3: Add the minimal page shell.**

```html
<form id="analysis-form">
  <input id="analysis-symbol" required placeholder="KRX:237350">
  <select id="analysis-interval"><option value="D">일봉</option></select>
  <button type="submit">차트 적용</button>
</form>
<div id="chart-host" aria-live="polite"></div>
```

Add `analysis.html` links to both existing headers. Extend `styles.css` only with page-specific glass-layout rules for the controls, watchlist, and chart height.

- [ ] **Step 4: Run static and syntax checks.**

Run: `node --check analysis.mjs; node --test tests/analysis.test.mjs; git diff --check`

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add analysis.html index.html settings.html styles.css tests/analysis.test.mjs
git commit -m "TradingView 분석 페이지 화면 추가"
```

### Task 3: Widget lifecycle, persistence, and deployment verification

**Files:**
- Modify: `analysis.mjs`
- Modify: `checklist.md`
- Modify: `context-notes.md`

**Interfaces:**
- Consumes: `#analysis-form`, `#analysis-symbol`, `#analysis-interval`, `#watchlist`, `#chart-host`, and `#analysis-error`.
- Produces: a recreated TradingView Advanced Chart widget configured with saved symbol, interval, watchlist, and visible toolbars.

- [ ] **Step 1: Extend tests for saved state.**

```js
test('reads valid saved state', () => {
  const storage = { getItem: () => JSON.stringify({ symbol: 'NASDAQ:AAPL', interval: '60', watchlist: ['NASDAQ:AAPL'] }) };
  assert.equal(readAnalysisState(storage).symbol, 'NASDAQ:AAPL');
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `node --test tests/analysis.test.mjs`

Expected: FAIL because `readAnalysisState` is absent or incomplete.

- [ ] **Step 3: Implement persistence and widget rendering.**

```js
function renderWidget(state) {
  chartHost.replaceChildren();
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.textContent = JSON.stringify({ symbol: state.symbol, interval: state.interval, allow_symbol_change: true, hide_top_toolbar: false, hide_side_toolbar: false, autosize: true });
  chartHost.append(script);
}
```

Wire form submission, watchlist add/remove/select actions, `localStorage.setItem`, and a script-error fallback link to the selected TradingView symbol.

- [ ] **Step 4: Run all verification.**

Run: `node --check analysis.mjs; node --test tests/analysis.test.mjs tests/allocation.test.mjs tests/portfolio.test.mjs tests/worker.test.mjs; python -m unittest discover -s tests -p 'test_*.py'; git diff --check`

Expected: all tests PASS.

- [ ] **Step 5: Deploy and verify.**

```bash
git add analysis.mjs tests/analysis.test.mjs checklist.md context-notes.md docs/superpowers/plans/2026-08-22-tradingview-analysis-page.md
git commit -m "TradingView 분석 설정 저장 구현"
git push
```

Verify `https://asher8554.github.io/stock_management/analysis.html` returns 200 and contains both the TradingView widget script and local-storage key.

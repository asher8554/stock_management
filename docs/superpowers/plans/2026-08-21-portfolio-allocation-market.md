# Portfolio Allocation and Market Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display authenticated KIS cash and stock allocation, plus public daily KRX and FRED market metrics.

**Architecture:** `sync_portfolio.py` adds KIS cash and stock values to the existing private snapshot. `worker.mjs` fetches KRX and FRED server-side, caches the normalized public response in KV, and exposes it at `GET /v1/market`. `app.mjs` renders actual allocation after the private snapshot loads and refreshes market cards every minute.

**Tech Stack:** Python standard library, JavaScript modules, Cloudflare Workers KV, KRX Open API, FRED CSV.

**Spec:** `docs/superpowers/specs/2026-08-21-portfolio-allocation-market-design.md`

## Global Constraints

- Keep KIS credentials and KRX `AUTH_KEY` server-side only.
- KRX KOSPI 100 and gold values are daily data and must be labeled `일별`.
- FRED `SP500`, `DGS10`, and `DGS30` values are daily data and must be labeled `일별`.
- Keep the existing authenticated `/v1/portfolio` boundary unchanged.
- Do not add dependencies.

---

### Task 1: Add KIS allocation values to the private snapshot

**Files:**
- Modify: `sync_portfolio.py:40-57`
- Modify: `tests/test_sync_portfolio.py`

**Interfaces:**
- Produces: KIS account objects with `cash` and `stockValue` numeric-string fields.
- Consumes: KIS balance response `output1` and `output2[0]`.

- [ ] **Step 1: Write the failing test**

```python
from sync_portfolio import kis_snapshot

def test_kis_snapshot_includes_cash_and_stock_value(self):
    account = kis_snapshot({
        "output1": [{"hldg_qty": "2", "evlu_amt": "3000"}],
        "output2": [{"dnca_tot_amt": "7000", "tot_evlu_amt": "3000"}],
    })
    self.assertEqual(account["cash"], "7000")
    self.assertEqual(account["stockValue"], "3000")
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `python -m unittest tests.test_sync_portfolio.TossCredentialsTest.test_kis_snapshot_includes_cash_and_stock_value`

Expected: FAIL because `kis_snapshot` is not defined.

- [ ] **Step 3: Implement the minimal mapper**

```python
def kis_snapshot(data):
    summary = data["output2"][0]
    return {"provider": "kis", "items": [...], "marketValue": summary.get("tot_evlu_amt"), "cash": summary.get("dnca_tot_amt"), "stockValue": summary.get("tot_evlu_amt")}
```

Replace the inline KIS return value with `kis_snapshot(data)`.

- [ ] **Step 4: Run Python tests**

Run: `python -m unittest discover -s tests -p 'test_*.py'`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sync_portfolio.py tests/test_sync_portfolio.py
git commit -m "KIS 실제 비중 데이터 추가"
```

### Task 2: Add a reusable actual-allocation mapper and private UI

**Files:**
- Modify: `portfolio.mjs`
- Modify: `tests/portfolio.test.mjs`
- Modify: `index.html:private-summary`
- Modify: `app.mjs:renderHoldings`
- Modify: `styles.css:private portfolio styles`

**Interfaces:**
- Consumes: snapshot account `cash` and `stockValue` fields from Task 1.
- Produces: `actualAllocation(snapshot)` returning `{ cash, stock, defense, cashPercent, stockPercent, defensePercent }`.

- [ ] **Step 1: Write the failing test**

```js
import { actualAllocation } from "../portfolio.mjs";

assert.deepEqual(actualAllocation({ accounts: [{ cash: "300", stockValue: "700" }] }), {
  cash: 300, stock: 700, defense: 0, cashPercent: 30, stockPercent: 70, defensePercent: 0,
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/portfolio.test.mjs`

Expected: FAIL because `actualAllocation` is not exported.

- [ ] **Step 3: Implement the mapper and display**

```js
export const actualAllocation = (snapshot) => {
  const totals = snapshot.accounts.reduce((sum, account) => ({ cash: sum.cash + Number(account.cash || 0), stock: sum.stock + Number(account.stockValue || account.marketValue || 0) }), { cash: 0, stock: 0 });
  const total = totals.cash + totals.stock;
  return { ...totals, defense: 0, cashPercent: total ? Math.round(totals.cash / total * 100) : 0, stockPercent: total ? Math.round(totals.stock / total * 100) : 0, defensePercent: 0 };
};
```

Render a compact `현재 보유 비중` block under private account status with cash amount, stock amount, and percentages. Keep target allocation controls unchanged.

- [ ] **Step 4: Run JavaScript checks**

Run: `node --test tests/portfolio.test.mjs && node --check app.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add portfolio.mjs tests/portfolio.test.mjs index.html app.mjs styles.css
git commit -m "현재 보유 비중 표시"
```

### Task 3: Add cached public market endpoint

**Files:**
- Modify: `worker.mjs`
- Modify: `tests/worker.test.mjs`

**Interfaces:**
- Produces: unauthenticated `GET /v1/market` JSON `{ updatedAt, metrics }`.
- Consumes: `env.KRX_API_KEY`, KRX daily endpoints with `basDd`, and FRED CSV data.

- [ ] **Step 1: Write the failing test**

```js
const market = await worker.fetch(new Request("https://api/v1/market"), { ...env, KRX_API_KEY: "key" });
assert.equal(market.status, 200);
assert.ok((await market.json()).metrics);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/worker.test.mjs`

Expected: FAIL with `not_found`.

- [ ] **Step 3: Implement minimal cached fetch**

```js
const marketKey = "market:latest";
const cached = await env.PORTFOLIO_CACHE.get(marketKey);
if (cached) return new Response(cached, { headers: publicHeaders });
```

Use KST date candidates for the prior seven calendar days. Request KRX with `?basDd=YYYYMMDD` and `AUTH_KEY`; select `코스피 100` from KOSPI rows and the first available gold row. Parse the most recent non-empty FRED CSV rows for `SP500`, `DGS10`, and `DGS30`. Cache successful normalized data for one hour. If fresh fetch fails and no cache exists, return `503` without private data.

- [ ] **Step 4: Run Worker tests**

Run: `node --test tests/worker.test.mjs && node --check worker.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker.mjs tests/worker.test.mjs
git commit -m "일별 시장 지표 API 추가"
```

### Task 4: Render and refresh market cards

**Files:**
- Modify: `index.html:metrics`
- Modify: `app.mjs`

**Interfaces:**
- Consumes: `GET /v1/market` Task 3 response.
- Produces: five rendered market cards with value, source, and daily timestamp.

- [ ] **Step 1: Write the minimal renderer**

```js
async function loadMarket() {
  const response = await fetch(`${apiBase}/v1/market`).catch(() => null);
  if (!response?.ok) return;
  renderMarket(await response.json());
}
```

- [ ] **Step 2: Update static fallback copy**

Replace all `연결 필요` cards with `일별 데이터 준비 중` and source labels.

- [ ] **Step 3: Render the fetched values safely**

Use `textContent`, not `innerHTML`, for all remote metric values. Set `#refresh` to the payload timestamp and schedule `setInterval(loadMarket, 60_000)`.

- [ ] **Step 4: Run checks**

Run: `node --check app.mjs && git diff --check`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html app.mjs
git commit -m "주요 지표 화면 연결"
```

### Task 5: Deploy, verify, and record result

**Files:**
- Modify: `checklist.md`
- Modify: `context-notes.md`

- [ ] **Step 1: Store KRX secret without printing it**

Run a Node subprocess that reads `KRX_API_KEY` from `.env` and writes it directly to `npx wrangler secret put KRX_API_KEY` stdin.

- [ ] **Step 2: Deploy Worker and Pages**

Run: `npx wrangler deploy`, then `git push`.

- [ ] **Step 3: Verify deployed boundaries**

Run: `GET /health` returns `200`; `GET /v1/market` returns `200` and exactly public metric fields; `GET /v1/portfolio` without a session returns `403`.

- [ ] **Step 4: Verify dashboard UI**

Load the published page, confirm five market cards show values, then authenticate and confirm cash, stock amount, and percent display without exposing values in logs.

- [ ] **Step 5: Record and commit work log**

```bash
git add checklist.md context-notes.md docs/superpowers/plans/2026-08-21-portfolio-allocation-market.md
git commit -m "실제 비중 및 시장 지표 작업 기록"
```

## Execution Status

- [x] Tasks 1-4 implemented and tested.
- [x] Worker deployed and KIS snapshot synchronized.
- [ ] KRX service key returns HTTP 401 and requires account-side correction before KOSPI 100 and gold values can load.

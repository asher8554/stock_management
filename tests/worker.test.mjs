// Worker의 수집 토큰과 GitHub 로그인 세션 검증을 확인합니다.
import assert from "node:assert/strict";
import worker from "../worker.mjs";

const cache = new Map();
const env = {
  INGEST_TOKEN: "ingest",
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
  GITHUB_SESSION_SECRET: "session-secret",
  ALLOWED_GITHUB_LOGIN: "\uFEFFowner",
  PORTFOLIO_CACHE: { get: (key) => cache.get(key), put: (key, value) => cache.set(key, value), delete: (key) => cache.delete(key), list: ({ prefix }) => ({ keys: [...cache.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })) }) },
};
const snapshot = { updatedAt: "2026-08-21T00:00:00Z", accounts: [] };

const missingCredential = await worker.fetch(new Request("https://api/v1/snapshot", { method: "POST", body: JSON.stringify(snapshot) }), env);
assert.deepEqual(await missingCredential.json(), { error: "unauthorized" });
const mismatchedCredential = await worker.fetch(new Request("https://api/v1/snapshot", { method: "POST", headers: { authorization: "Bearer wrong" }, body: JSON.stringify(snapshot) }), env);
assert.deepEqual(await mismatchedCredential.json(), { error: "unauthorized" });
assert.equal((await worker.fetch(new Request("https://api/v1/snapshot", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify(snapshot) }), env)).status, 200);
assert.equal((await worker.fetch(new Request("https://api/v1/portfolio"), env)).status, 403);

const login = await worker.fetch(new Request("https://api/auth/github"), env);
assert.equal(login.status, 302);
const state = new URL(login.headers.get("location")).searchParams.get("state");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => String(url).includes("access_token") ? Response.json({ access_token: "oauth-token" }) : Response.json({ login: "owner" });
const callback = await worker.fetch(new Request(`https://api/auth/github/callback?code=code&state=${state}`), env);
globalThis.fetch = originalFetch;
assert.equal(callback.status, 302);
const session = new URL(callback.headers.get("location")).hash.split("=")[1];
assert.equal((await worker.fetch(new Request("https://api/v1/portfolio", { headers: { authorization: `Bearer ${session}` } }), env)).status, 200);

cache.set("market:latest", JSON.stringify({ updatedAt: "2026-08-21T00:00:00Z", metrics: { kospi100: { value: "1,000" } } }));
const market = await worker.fetch(new Request("https://api/v1/market"), { ...env, KRX_API_KEY: "key" });
assert.equal(market.status, 200);
assert.equal((await market.json()).metrics.kospi100.value, "1,000");

cache.clear();
globalThis.fetch = async (url) => String(url).includes("api.stlouisfed.org") ? Response.json({ observations: [{ date: "2026-08-21", value: "123.45" }] }) : Response.json({ OutBlock_1: [] });
const fredMarket = await worker.fetch(new Request("https://api/v1/market"), { ...env, KRX_API_KEY: "key", FRED_API_KEY: "fred-key" });
globalThis.fetch = originalFetch;
assert.equal((await fredMarket.json()).metrics.sp500.value, "123.45");

const krxSnapshot = { updatedAt: "2026-08-21T00:00:00Z", metrics: { kospi100: { value: "1,000", asOf: "2026-08-20", source: "KRX", unit: "pt" }, gold: { value: "100,000", asOf: "2026-08-20", source: "KRX", unit: "원/g" } } };
assert.equal((await worker.fetch(new Request("https://api/v1/market/krx", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify(krxSnapshot) }), env)).status, 200);
cache.delete("market:latest");
globalThis.fetch = async () => Response.json({ observations: [{ date: "2026-08-21", value: "123.45" }] });
const mergedMarket = await worker.fetch(new Request("https://api/v1/market"), { ...env, FRED_API_KEY: "fred-key" });
globalThis.fetch = originalFetch;
assert.equal((await mergedMarket.json()).metrics.kospi100.value, "1,000");

const realtimeSnapshot = { updatedAt: "2026-08-22T00:00:00Z", symbols: { "237350": [{ time: "20260822T090000", price: 100, volume: 1 }] } };
assert.equal((await worker.fetch(new Request("https://api/v1/realtime", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify(realtimeSnapshot) }), env)).status, 200);
assert.equal((await worker.fetch(new Request("https://api/v1/realtime", { headers: { authorization: `Bearer ${session}` } }), env)).status, 200);
const intradaySnapshot = { symbol: "237350", bars: [{ time: "20260821T090000", close: 100 }] };
assert.equal((await worker.fetch(new Request("https://api/v1/intraday", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify(intradaySnapshot) }), env)).status, 200);
assert.equal((await worker.fetch(new Request("https://api/v1/intraday", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify({ ...intradaySnapshot, bars: [{ time: "20260821T090100", close: 101 }], append: true }) }), env)).status, 200);
assert.equal(cache.has("intraday:237350:20260821"), true);
const intraday = await worker.fetch(new Request("https://api/v1/intraday?symbol=237350", { headers: { authorization: `Bearer ${session}` } }), env);
assert.equal(intraday.status, 200);
assert.equal((await intraday.json()).bars.length, 2);

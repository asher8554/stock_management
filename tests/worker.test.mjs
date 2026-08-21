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
  PORTFOLIO_CACHE: { get: (key) => cache.get(key), put: (key, value) => cache.set(key, value), delete: (key) => cache.delete(key) },
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

// Worker가 수집 토큰과 Cloudflare Access 사용자를 분리하는지 확인한다.
import assert from "node:assert/strict";
import worker from "../worker.mjs";

const cache = new Map();
const env = { INGEST_TOKEN: "ingest", ALLOWED_EMAIL: "admin@example.com", PORTFOLIO_CACHE: { get: (key) => cache.get(key), put: (key, value) => cache.set(key, value) } };
const snapshot = { updatedAt: "2026-08-21T00:00:00Z", accounts: [] };

assert.equal((await worker.fetch(new Request("https://api/v1/snapshot", { method: "POST", body: JSON.stringify(snapshot) }), env)).status, 401);
assert.equal((await worker.fetch(new Request("https://api/v1/snapshot", { method: "POST", headers: { authorization: "Bearer ingest" }, body: JSON.stringify(snapshot) }), env)).status, 200);
assert.equal((await worker.fetch(new Request("https://api/v1/portfolio"), env)).status, 403);
const privateResponse = await worker.fetch(new Request("https://api/v1/portfolio"), env, { access: { identity: { email: "admin@example.com" } } });
assert.equal(privateResponse.status, 200);
assert.equal((await worker.fetch(new Request("https://api/v1/portfolio"), { ...env, ALLOWED_EMAIL: undefined })).status, 403);

// 로컬 동기화기가 전송한 비식별 포트폴리오 스냅샷을 안전하게 제공한다.
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

const authorized = (request, token) => request.headers.get("authorization") === `Bearer ${token}`;
const cors = (request) => request.headers.get("origin") === "https://asher8554.github.io" ? { "access-control-allow-origin": "https://asher8554.github.io", "access-control-allow-credentials": "true", "access-control-allow-headers": "authorization, content-type", "vary": "origin" } : {};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const headers = cors(request);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method === "GET" && pathname === "/health") return json({ ok: true }, 200, headers);
    if (request.method === "POST" && pathname === "/v1/snapshot") {
      if (!authorized(request, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, headers);
      const snapshot = await request.json().catch(() => null);
      if (!snapshot?.updatedAt || !Array.isArray(snapshot.accounts)) return json({ error: "invalid_snapshot" }, 400, headers);
      await env.PORTFOLIO_CACHE.put("latest", JSON.stringify(snapshot));
      return json({ ok: true }, 200, headers);
    }
    if (request.method === "GET" && pathname === "/v1/portfolio") {
      if (ctx?.access?.identity?.email !== env.ALLOWED_EMAIL) return json({ error: "forbidden" }, 403, headers);
      const snapshot = await env.PORTFOLIO_CACHE.get("latest");
      return snapshot ? new Response(snapshot, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } }) : json({ error: "not_synced" }, 503, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  },
};

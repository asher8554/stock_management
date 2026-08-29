// GitHub 로그인으로 개인 포트폴리오 API 접근을 제한하는 Cloudflare Worker입니다.
const text = new TextEncoder();
const securityHeaders = {
  "content-security-policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), geolocation=(), microphone=()",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...securityHeaders, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

async function authorized(request, token) {
  const candidate = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/)?.[1];
  if (!token || !candidate) return false;
  const key = await crypto.subtle.importKey("raw", text.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  // Keep the equality check inside Web Crypto rather than JavaScript string comparison.
  const signature = await crypto.subtle.sign("HMAC", key, text.encode(token));
  return crypto.subtle.verify("HMAC", key, signature, text.encode(candidate));
}

const cors = (request) => {
  const allowed = request.headers.get("origin") === "https://asher8554.github.io";
  return {
    ...securityHeaders,
    ...(allowed ? {
      "access-control-allow-origin": "https://asher8554.github.io",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-max-age": "86400",
      "vary": "origin",
    } : {}),
  };
};
const base64Url = (value) => btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const fromBase64Url = (value) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4)), (character) => character.charCodeAt(0));

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", text.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return crypto.subtle.sign("HMAC", key, text.encode(value));
}

async function createSession(login, secret) {
  const payload = base64Url(text.encode(JSON.stringify({ login, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 })));
  return `${payload}.${base64Url(await hmac(payload, secret))}`;
}

async function hasSession(request, secret) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  try {
    const key = await crypto.subtle.importKey("raw", text.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), text.encode(payload));
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return valid && typeof session.login === "string" && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

const allowedGitHubLogin = (env) => env.ALLOWED_GITHUB_LOGIN?.trim().toLowerCase();
const githubConfigured = (env) => [env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, env.GITHUB_SESSION_SECRET, allowedGitHubLogin(env)].every(Boolean);
const callbackUrl = () => "https://stock-management-private-api.household-account-asher.workers.dev/auth/github/callback";
const redirect = (url) => new Response(null, { status: 302, headers: { ...securityHeaders, "cache-control": "no-store", location: url } });
const cookie = (request, name) => request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
const marketHeaders = (headers) => ({ ...securityHeaders, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
const number = (value) => Number(String(value).replaceAll(",", ""));
const metric = (value, asOf, source, unit = "") => ({ value: Number.isFinite(number(value)) ? number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : String(value), asOf, source, unit });

async function fredMetric(id, unit, key) {
  if (!key) throw new Error("fred_not_configured");
  const query = new URLSearchParams({ series_id: id, api_key: key, file_type: "json", sort_order: "desc", limit: "10" });
  const body = await fetch(`https://api.stlouisfed.org/fred/series/observations?${query}`).then((response) => response.ok ? response.json() : null);
  if (!body?.observations) throw new Error("fred_unavailable");
  for (const observation of body.observations) {
    if (observation.value !== ".") return metric(observation.value, observation.date, "FRED", unit);
  }
  throw new Error("fred_empty");
}

async function freshMarket(env) {
  const [sp500Result, treasury10Result, treasury30Result] = await Promise.allSettled([fredMetric("SP500", "pt", env.FRED_API_KEY), fredMetric("DGS10", "%", env.FRED_API_KEY), fredMetric("DGS30", "%", env.FRED_API_KEY)]);
  const value = (result, fallback) => result.status === "fulfilled" ? result.value : fallback;
  const sp500 = value(sp500Result, null);
  const treasury10 = value(treasury10Result, null);
  const treasury30 = value(treasury30Result, null);
  const unavailable = (source, message = "데이터 없음") => ({ value: message, asOf: "-", source, unit: "" });
  return { updatedAt: new Date().toISOString(), metrics: { kospi100: unavailable("KRX"), sp500: sp500 || unavailable("FRED", "연결 오류"), gold: unavailable("KRX"), treasury10: treasury10 || unavailable("FRED", "연결 오류"), treasury30: treasury30 || unavailable("FRED", "연결 오류") } };
}

async function market(request, env, headers) {
  const current = await env.PORTFOLIO_CACHE.get("market:latest");
  if (current) return new Response(current, { headers: marketHeaders(headers) });
  try {
    const fresh = await freshMarket(env);
    const krx = JSON.parse(await env.PORTFOLIO_CACHE.get("market:krx") || "null");
    const value = JSON.stringify(krx ? { ...fresh, updatedAt: krx.updatedAt, metrics: { ...fresh.metrics, ...krx.metrics } } : fresh);
    try {
      await env.PORTFOLIO_CACHE.put("market:latest", value, { expirationTtl: 3600 });
      await env.PORTFOLIO_CACHE.put("market:last", value);
    } catch {}
    return new Response(value, { headers: marketHeaders(headers) });
  } catch {
    const previous = await env.PORTFOLIO_CACHE.get("market:last");
    return previous ? new Response(previous, { headers: marketHeaders(headers) }) : json({ error: "market_unavailable" }, 503, headers);
  }
}

async function startGitHubLogin(env) {
  if (!githubConfigured(env)) return json({ error: "github_auth_not_configured" }, 503);
  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callbackUrl(), state, login: allowedGitHubLogin(env), allow_signup: "false" }).toString();
  return new Response(null, { status: 302, headers: { ...securityHeaders, "cache-control": "no-store", location: url.toString(), "set-cookie": `github-oauth-state=${state}; Path=/auth/github; HttpOnly; Secure; SameSite=Lax; Max-Age=600` } });
}

async function completeGitHubLogin(request, env) {
  if (!githubConfigured(env)) return json({ error: "github_auth_not_configured" }, 503);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== cookie(request, "github-oauth-state")) return json({ error: "invalid_oauth_state" }, 400);
  const exchange = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callbackUrl() }),
  }).then((response) => response.ok ? response.json() : null).catch(() => null);
  if (!exchange?.access_token) return json({ error: "github_oauth_failed" }, 502);
  const user = await fetch("https://api.github.com/user", { headers: { authorization: `Bearer ${exchange.access_token}`, "user-agent": "stock-management-private-api" } }).then((response) => response.ok ? response.json() : null).catch(() => null);
  if (!user?.login || user.login.toLowerCase() !== allowedGitHubLogin(env)) return json({ error: "forbidden" }, 403);
  const session = await createSession(user.login, env.GITHUB_SESSION_SECRET);
  return redirect(`https://asher8554.github.io/stock_management/#github-auth=${encodeURIComponent(session)}`);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const headers = cors(request);
    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method === "GET" && pathname === "/health") return json({ ok: true }, 200, headers);
    if (request.method === "GET" && pathname === "/v1/market") return market(request, env, headers);
    if (request.method === "GET" && pathname === "/auth/github") return startGitHubLogin(env);
    if (request.method === "GET" && pathname === "/auth/github/callback") return completeGitHubLogin(request, env);
    if (request.method === "POST" && pathname === "/v1/snapshot") {
      if (!await authorized(request, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, headers);
      const snapshot = await request.json().catch(() => null);
      if (!snapshot?.updatedAt || !Array.isArray(snapshot.accounts)) return json({ error: "invalid_snapshot" }, 400, headers);
      await env.PORTFOLIO_CACHE.put("latest", JSON.stringify(snapshot));
      return json({ ok: true }, 200, headers);
    }
    if (request.method === "POST" && pathname === "/v1/market/krx") {
      if (!await authorized(request, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, headers);
      const snapshot = await request.json().catch(() => null);
      if (!snapshot?.updatedAt || !snapshot?.metrics?.kospi100 || !snapshot?.metrics?.gold) return json({ error: "invalid_market_snapshot" }, 400, headers);
      await env.PORTFOLIO_CACHE.put("market:krx", JSON.stringify(snapshot));
      await env.PORTFOLIO_CACHE.delete("market:latest");
      return json({ ok: true }, 200, headers);
    }
    if (request.method === "POST" && pathname === "/v1/realtime") {
      if (!await authorized(request, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, headers);
      const snapshot = await request.json().catch(() => null);
      if (!snapshot?.updatedAt || !snapshot?.symbols || typeof snapshot.symbols !== "object") return json({ error: "invalid_realtime_snapshot" }, 400, headers);
      await env.PORTFOLIO_CACHE.put("realtime:latest", JSON.stringify(snapshot));
      return json({ ok: true }, 200, headers);
    }
    if (request.method === "GET" && pathname === "/v1/portfolio") {
      if (!await hasSession(request, env.GITHUB_SESSION_SECRET)) return json({ error: "forbidden" }, 403, headers);
      const snapshot = await env.PORTFOLIO_CACHE.get("latest");
      return snapshot ? new Response(snapshot, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } }) : json({ error: "not_synced" }, 503, headers);
    }
    if (request.method === "GET" && pathname === "/v1/realtime") {
      if (!await hasSession(request, env.GITHUB_SESSION_SECRET)) return json({ error: "forbidden" }, 403, headers);
      const snapshot = await env.PORTFOLIO_CACHE.get("realtime:latest");
      return snapshot ? new Response(snapshot, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } }) : json({ error: "not_collected" }, 503, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  },
};

// GitHub 로그인으로 개인 포트폴리오 API 접근을 제한하는 Cloudflare Worker입니다.
const text = new TextEncoder();
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

const authorized = (request, token) => request.headers.get("authorization") === `Bearer ${token}`;
const cors = (request) => request.headers.get("origin") === "https://asher8554.github.io" ? { "access-control-allow-origin": "https://asher8554.github.io", "access-control-allow-headers": "authorization, content-type", "vary": "origin" } : {};
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
const callbackUrl = (request) => new URL("/auth/github/callback", request.url).toString();
const redirect = (url) => Response.redirect(url, 302);

async function startGitHubLogin(request, env) {
  if (!githubConfigured(env)) return json({ error: "github_auth_not_configured" }, 503);
  const state = crypto.randomUUID();
  await env.PORTFOLIO_CACHE.put(`oauth:${state}`, "1", { expirationTtl: 600 });
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: callbackUrl(request), state, login: allowedGitHubLogin(env), allow_signup: "false" }).toString();
  return redirect(url);
}

async function completeGitHubLogin(request, env) {
  if (!githubConfigured(env)) return json({ error: "github_auth_not_configured" }, 503);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !await env.PORTFOLIO_CACHE.get(`oauth:${state}`)) return json({ error: "invalid_oauth_state" }, 400);
  await env.PORTFOLIO_CACHE.delete(`oauth:${state}`);
  const exchange = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callbackUrl(request) }),
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
    if (request.method === "GET" && pathname === "/auth/github") return startGitHubLogin(request, env);
    if (request.method === "GET" && pathname === "/auth/github/callback") return completeGitHubLogin(request, env);
    if (request.method === "POST" && pathname === "/v1/snapshot") {
      if (!authorized(request, env.INGEST_TOKEN)) return json({ error: "unauthorized" }, 401, headers);
      const snapshot = await request.json().catch(() => null);
      if (!snapshot?.updatedAt || !Array.isArray(snapshot.accounts)) return json({ error: "invalid_snapshot" }, 400, headers);
      await env.PORTFOLIO_CACHE.put("latest", JSON.stringify(snapshot));
      return json({ ok: true }, 200, headers);
    }
    if (request.method === "GET" && pathname === "/v1/portfolio") {
      if (!await hasSession(request, env.GITHUB_SESSION_SECRET)) return json({ error: "forbidden" }, 403, headers);
      const snapshot = await env.PORTFOLIO_CACHE.get("latest");
      return snapshot ? new Response(snapshot, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } }) : json({ error: "not_synced" }, 503, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  },
};

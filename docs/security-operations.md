# Security Operations

## Current Controls

- `.env` is ignored and must never be committed.
- The Worker accepts ingestion only with `INGEST_TOKEN`.
- Private portfolio reads require a signed GitHub OAuth session.
- The Worker allows browser CORS only from `https://asher8554.github.io`.

## Deploy Verification

1. Run `npx wrangler deploy` from the repository root.
2. Confirm `GET /health` returns `200`.
3. Complete one GitHub login and confirm `/v1/portfolio` returns data only with its session token.
4. Confirm the Synology collector can still post one authenticated snapshot.

## INGEST_TOKEN Rotation

Rotate during one maintenance window. Changing only one side stops NAS ingestion.

1. Generate a new value locally with `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`.
2. Update Cloudflare Worker secret `INGEST_TOKEN` without copying the value into source control or logs.
3. Update Synology `.env.realtime` `PORTFOLIO_INGEST_TOKEN` with the same value.
4. Restart `kis-realtime` and `kis-daily-sync`.
5. Verify an authenticated `POST /v1/realtime` or the next daily snapshot succeeds; revoke the old value only after this check.

## Provider-Key Rotation

If a provider reports compromise, rotate its key in that provider's console first, then update only the private Cloudflare or Synology secret store. Do not place a live value in `.env.realtime.example`, source files, GitHub Actions, issue comments, or chat logs.

## Cloudflare Rate Limits

Configure rules in the Cloudflare dashboard, not KV-based application throttling. KV writes are quota-sensitive.

- `/auth/github*`: per-IP rate limit to reduce OAuth abuse.
- `POST /v1/*`: per-IP rate limit high enough for the one-minute collector cadence and daily sync.
- Keep `/v1/market` cacheable at the CDN edge where plan capabilities permit.

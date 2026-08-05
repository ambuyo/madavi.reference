# Dokploy Nixpacks Deployment Configuration

**Date:** 2026-08-05
**Status:** Implemented

## Overview

The `nixpacks.toml` at the repo root already existed and was updated with `PORT`/`HOST` variables so Dokploy correctly routes traffic to the Astro SSR app on the Hostinger VPS.

## Architecture

```
Git push → Dokploy (Nixpacks) → Build Docker image → Deploy container
                                       │
                              Reads nixpacks.toml
```

Nixpacks auto-detects:
- **Package manager:** pnpm (from `pnpm-lock.yaml`)
- **Runtime:** Node.js
- **Monorepo structure:** pnpm workspaces (`apps/*`)

## Files

### `nixpacks.toml` (new, repo root)

```toml
[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm --filter @madavi/web run build"]

[start]
cmd = "node apps/web/dist/server/entry.mjs"

[variables]
PORT = "4321"
HOST = "0.0.0.0"
```

### No code changes

- `@astrojs/node` standalone reads `PORT` and `HOST` from the environment
- `DEPLOY_TARGET` defaults to `vps` in the web package's build script
- `pnpm-workspace.yaml` already defines the monorepo

## Dokploy dashboard configuration

### Env vars (secrets — set in Dokploy UI, not in repo)

| Variable | Source |
|----------|--------|
| `PUBLIC_SANITY_PROJECT_ID` | Sanity dashboard |
| `PUBLIC_SANITY_DATASET` | Sanity dashboard |
| `SANITY_PROJECT_ID` | Sanity dashboard |
| `SANITY_DATASET` | Sanity dashboard |
| `SANITY_API_VERSION` | Sanity dashboard |
| `SANITY_READ_TOKEN` | Sanity dashboard |
| `WP_USERNAME` | WordPress admin |
| `WP_APP_PASSWORD` | WordPress admin |
| `WEBHOOK_SECRET` | Generated |
| `ZOHO_CLIENT_ID` | Zoho API console |
| `ZOHO_CLIENT_SECRET` | Zoho API console |
| `ZOHO_REFRESH_TOKEN` | Zoho API console |
| `ZOHO_DATACENTER` | Zoho API console |
| `PUBLIC_GA4_ID` | Google Analytics |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `PUBLIC_R2_CDN_URL` | Cloudflare R2 |

### Domain

- `madavi.co` with Traefik auto-HTTPS (Let's Encrypt)

## Verification

1. Push to git — Dokploy auto-detects and starts build
2. Check Dokploy build logs for `pnpm install` and `astro build` success
3. App starts on port 4321, Traefik routes `madavi.co` → container

# Deploy HushVoice on Vercel

HushVoice is two parts:

| Piece | Where it runs | Notes |
| --- | --- | --- |
| **Web UI + API routes** | **Vercel** | Next.js app |
| **HushVoice engine** (clone + TTS) | **Your always-on server** | Docker, GPU/CPU VPS — **not** Vercel |

Vercel cannot run the ML engine (GPU/CPU models, long jobs, Docker). Point the Vercel app at a public engine URL.

## 1. Host the HushVoice engine (required)

On a VPS / home server with Docker (8GB+ RAM recommended):

```bash
# Set ENGINE_SOURCE_URL to a compatible FastAPI voice-stack git repo
export ENGINE_SOURCE_URL="https://…"

docker compose up -d --build engine
```

Expose port `17493` publicly (or via Cloudflare Tunnel / Tailscale Funnel / nginx + TLS).

Health check:

```bash
curl https://YOUR-ENGINE-HOST/health
```

**Security tip:** Put the engine behind a reverse proxy, restrict by IP or basic auth, and only allow HTTPS. The Next.js server routes call the engine with `HUSHVOICE_ENGINE_URL` (server-side).

## 2. Deploy the UI to Vercel

### Option A — Vercel Dashboard (easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `sushant-kataria/hushvoice`
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:

| Name | Value | Environment |
| --- | --- | --- |
| `HUSHVOICE_ENGINE_URL` | `https://YOUR-ENGINE-HOST` | Production, Preview |
| `HUSHVOICE_TTS_ENGINE` | `chatterbox` | Production, Preview |

5. Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add HUSHVOICE_ENGINE_URL
# paste https://YOUR-ENGINE-HOST
vercel env add HUSHVOICE_TTS_ENGINE
# paste chatterbox
vercel --prod
```

## 3. Verify

```bash
curl https://YOUR-VERCEL-APP.vercel.app/api/health
```

You should see `"engineHealth": { "ok": true, ... }` and `"apiKeysRequired": false`.

Then open `/studio`, record a prompt, clone, and speak.

## Local preview of production env

```bash
# .env.local
HUSHVOICE_ENGINE_URL=https://YOUR-ENGINE-HOST
HUSHVOICE_TTS_ENGINE=chatterbox

npm run dev
```

## Common issues

| Symptom | Fix |
| --- | --- |
| Studio: “Engine offline” | `HUSHVOICE_ENGINE_URL` wrong, engine down, or firewall blocking Vercel → your server |
| Clone/speak timeouts | Engine too slow / cold model load — keep container warm; first request downloads models |
| CORS errors | Shouldn’t happen — HushVoice proxies via `/api/*`. Don’t call the engine from the browser |
| Hobby function timeout | Speak uses short poll requests (`POST /api/speak` then `GET /api/speak/:id`) — should fit Hobby limits |

## Architecture

```
Browser → Vercel (Next.js /api/clone, /api/speak, /api/voices)
                ↓ HUSHVOICE_ENGINE_URL
         Your server (HushVoice engine :17493)
                ↓
         Local Chatterbox models (no API keys)
```

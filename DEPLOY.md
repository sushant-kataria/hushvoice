# Deploy HushVoice on Vercel

HushVoice is two parts:

| Piece | Where it runs | Notes |
| --- | --- | --- |
| **Web UI + API routes** | **Vercel** | Next.js app |
| **Voicebox** (clone + TTS) | **Your always-on server** | Docker, GPU/CPU VPS — **not** Vercel |

Vercel cannot run Voicebox (GPU/CPU models, long jobs, Docker). Point the Vercel app at a public Voicebox URL.

## 1. Host Voicebox (required)

On a VPS / home server with Docker (8GB+ RAM recommended):

```bash
git clone https://github.com/jamiepine/voicebox.git
cd voicebox
docker compose up -d --build
```

Expose port `17493` publicly (or via Cloudflare Tunnel / Tailscale Funnel / nginx + TLS).

Health check:

```bash
curl https://YOUR-VOICEBOX-HOST/health
```

**Security tip:** Put Voicebox behind a reverse proxy, restrict by IP or basic auth, and only allow HTTPS. HushVoice’s server routes call Voicebox with `VOICEBOX_URL` (server-side), so the browser never needs the Voicebox URL if you keep it private to Vercel’s network — but for a simple setup, a public HTTPS URL is fine.

## 2. Deploy the UI to Vercel

### Option A — Vercel Dashboard (easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `sushant-kataria/hushvoice`
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:

| Name | Value | Environment |
| --- | --- | --- |
| `VOICEBOX_URL` | `https://YOUR-VOICEBOX-HOST` | Production, Preview |
| `VOICEBOX_ENGINE` | `chatterbox` | Production, Preview |

5. Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add VOICEBOX_URL
# paste https://YOUR-VOICEBOX-HOST
vercel env add VOICEBOX_ENGINE
# paste chatterbox
vercel --prod
```

## 3. Verify

```bash
curl https://YOUR-VERCEL-APP.vercel.app/api/health
```

You should see `"voicebox": { "ok": true, ... }` and `"apiKeysRequired": false`.

Then open `/studio`, record a prompt, clone, and speak.

## Local preview of production env

```bash
# .env.local
VOICEBOX_URL=https://YOUR-VOICEBOX-HOST
VOICEBOX_ENGINE=chatterbox

npm run dev
```

## Common issues

| Symptom | Fix |
| --- | --- |
| Studio: “Voicebox offline” | `VOICEBOX_URL` wrong, Voicebox down, or firewall blocking Vercel → your server |
| Clone/speak timeouts | Voicebox too slow / cold model load — keep container warm; first request downloads models |
| CORS errors | Shouldn’t happen — HushVoice proxies via `/api/*`. Don’t call Voicebox from the browser |
| Hobby function timeout | Speak uses short poll requests (`POST /api/speak` then `GET /api/speak/:id`) — should fit Hobby limits |

## Architecture

```
Browser → Vercel (Next.js /api/clone, /api/speak, /api/voices)
                ↓ VOICEBOX_URL
         Your server (Voicebox :17493)
                ↓
         Local Chatterbox models (no API keys)
```

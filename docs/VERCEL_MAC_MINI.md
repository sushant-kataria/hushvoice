# HushVoice on Vercel + Mac Mini (engine)

Run the **website on Vercel** and the **voice engine on your Mac Mini**.

```
Users → Vercel (Next.js UI)
           ↓ HUSHVOICE_ENGINE_URL
     Mac Mini → docker compose engine (:17493)
```

Vercel cannot run the ML engine. The Mac Mini must stay on and expose the engine over HTTPS.

## Part A — Engine on the Mac Mini

### 1. Keep the engine running

```bash
cd ~/Desktop/hushvoice   # your clone path
docker compose up -d engine
curl -f http://127.0.0.1:17493/health
```

Optional: set Docker Desktop to start on login so the engine survives reboots.

### 2. Expose the engine with Cloudflare Tunnel (recommended, free HTTPS)

Do **not** open random ports on your home router if you can avoid it. Tunnel is simpler and safer.

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Add a domain (or use a Cloudflare-managed domain)
3. Install `cloudflared` on the Mac Mini:

```bash
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create hushvoice-engine
```

4. Configure the tunnel to point at the local engine. Example config
   (`~/.cloudflared/config.yml`):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /Users/<you>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: engine.yourdomain.com
    service: http://127.0.0.1:17493
  - service: http_status:404
```

5. Route DNS and run:

```bash
cloudflared tunnel route dns hushvoice-engine engine.yourdomain.com
cloudflared tunnel run hushvoice-engine
```

6. Verify from any network (phone LTE is a good test):

```bash
curl -f https://engine.yourdomain.com/health
```

Keep `cloudflared` running (LaunchAgent / login item) whenever you want the Vercel app to work.

**Quick test without a domain:** `cloudflared tunnel --url http://127.0.0.1:17493` gives a temporary `*.trycloudflare.com` URL. Fine for demos; it changes when restarted.

## Part B — Deploy the UI on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **`sushant-kataria/hushvoice`**
3. Branch: `cursor/hushvoice-voice-maker-af42` (or `main` after merge)
4. Framework: **Next.js**
5. Environment variables:

| Name | Value |
| --- | --- |
| `HUSHVOICE_ENGINE_URL` | `https://engine.yourdomain.com` |
| `HUSHVOICE_TTS_ENGINE` | `chatterbox` |
| `HUSHVOICE_ENGINE_API_KEY` | same secret as Mac Mini `ENGINE_API_KEY` |
| `HUSHVOICE_BILLING_MODE` | `metered` |
| `HUSHVOICE_SESSION_SECRET` | long random string |
| `HUSHVOICE_DATABASE_URL` | Turso/libsql URL (required on Vercel — local file DB won’t persist) |
| `HUSHVOICE_DATABASE_AUTH_TOKEN` | Turso token |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | webhook signing secret → `https://your-app.vercel.app/api/billing/webhook` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

6. Deploy

### Or CLI

```bash
npm i -g vercel
cd ~/Desktop/hushvoice
vercel login
vercel link
vercel env add HUSHVOICE_ENGINE_URL
# paste https://engine.yourdomain.com
vercel env add HUSHVOICE_TTS_ENGINE
# paste chatterbox
vercel --prod
```

## Part C — Verify

```bash
curl -s https://YOUR-APP.vercel.app/api/health
```

Expect `"engineHealth": { "ok": true }`.

Open `https://YOUR-APP.vercel.app/studio` → Engine online → record → clone → speak.

Allow the microphone in the browser (HTTPS sites can use the mic).

## Mac Mini checklist

- [ ] Mac Mini stays awake (System Settings → Energy: prevent sleep when display is off / TV use)
- [ ] Docker Desktop running
- [ ] `hushvoice-engine` container healthy
- [ ] Cloudflare Tunnel running
- [ ] Public `curl https://engine…/health` works
- [ ] Vercel env vars set and redeployed

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Studio: Engine offline on Vercel | Tunnel down, Mac asleep, Docker stopped, or wrong `HUSHVOICE_ENGINE_URL` |
| Works on Mac, not on Vercel | Engine only on localhost — must use public HTTPS tunnel URL in Vercel |
| Mic blocked | Use the `https://…vercel.app` URL; allow mic for that site |
| Slow speak | Normal on Mac Mini CPU; keep engine warm (don’t restart constantly) |

## Local UI still works

On the Mac Mini you can keep using:

```bash
npm run dev
# http://localhost:3000  with HUSHVOICE_ENGINE_URL=http://127.0.0.1:17493
```

Vercel is optional for accessing the same engine from phones/other devices.

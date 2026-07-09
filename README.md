# HushVoice

Clone your voice. Speak any language. **Fully self-hosted — no API keys.**

Record a sentence shown on screen → create a local voice clone → type anything and hear it spoken back in your voice.

HushVoice is a complete product: a web UI plus an always-on voice engine you run yourself. UI built with [shadcn/ui](https://ui.shadcn.com), visual craft inspired by [Sarvam](https://www.sarvam.ai).

## How it works

1. **Record** the on-screen prompt in your language  
2. **Clone** — HushVoice creates a voice profile + reference sample on your engine  
3. **Speak** — type any text; the engine synthesizes audio in your cloned voice  

No cloud TTS keys. Models download once into a local cache.

## Quick start

### 1. Start the HushVoice engine

```bash
docker compose up -d --build engine
```

Wait until healthy:

```bash
curl http://127.0.0.1:17493/health
```

First boot downloads ML models (several GB). Keep the container running.

### 2. Start the web UI

```bash
cp .env.example .env.local   # optional — defaults already point at localhost:17493
npm install
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio), allow the mic, record ≥3s, clone, then type and speak.

### Full stack in Docker

```bash
docker compose --profile full up -d --build
```

## Deploy on Vercel

The **UI deploys to Vercel**. The **HushVoice engine** must run on a separate always-on host (VPS/Docker) — Vercel cannot run the ML models.

1. Host the engine with a public HTTPS URL (see [DEPLOY.md](./DEPLOY.md))
2. Import this repo in [vercel.com/new](https://vercel.com/new)
3. Set env vars:
   - `HUSHVOICE_ENGINE_URL` = `https://your-engine-host`
   - `HUSHVOICE_TTS_ENGINE` = `chatterbox`
4. Deploy

Full walkthrough: **[DEPLOY.md](./DEPLOY.md)**  
Free Oracle Cloud engine host (capacity checks included): **[docs/ORACLE_CLOUD.md](./docs/ORACLE_CLOUD.md)**

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `HUSHVOICE_ENGINE_URL` | `http://127.0.0.1:17493` | Always-on HushVoice engine base URL |
| `HUSHVOICE_TTS_ENGINE` | `chatterbox` | TTS model family for multilingual cloning |

## Languages

Chatterbox Multilingual: English, Hindi, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Arabic, Italian, Russian, Dutch, Turkish, Polish, Swedish, Danish, Finnish, Greek, Hebrew, Malay, Norwegian, Swahili.

## Stack

- **UI:** Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui  
- **Engine:** HushVoice FastAPI service — local zero-shot cloning  
- **Default model:** Chatterbox Multilingual  

## API (UI → engine)

| Web UI | Engine |
| --- | --- |
| `POST /api/clone` | `POST /profiles` + `POST /profiles/{id}/samples` |
| `POST /api/speak` | `POST /generate` → poll → `GET /audio/{id}` |
| `GET /api/voices` | `GET /profiles` |
| `GET /api/health` | `GET /health` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start web UI |
| `npm run build` | Production build |
| `npm run start` | Start production UI |
| `npm run lint` | ESLint |
| `npm run engine` | Start local HushVoice engine |
| `docker compose up -d engine` | Start local voice engine |

## Hardware notes

The engine recommends several GB of RAM (compose limits default to 8GB). CPU works; GPU builds are faster for production.

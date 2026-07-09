# HushVoice

Clone your voice. Speak any language. **Fully self-hosted — no API keys.**

Record a sentence shown on screen → create a local voice clone → type anything and hear it spoken back in your voice.

Powered by [Voicebox](https://github.com/jamiepine/voicebox) (Chatterbox Multilingual) running on your own machine. UI built with [shadcn/ui](https://ui.shadcn.com), visual craft inspired by [Sarvam](https://www.sarvam.ai).

## How it works

1. **Record** the on-screen prompt in your language  
2. **Clone** — HushVoice creates a Voicebox profile + reference sample locally  
3. **Speak** — type any text; Voicebox synthesizes audio in your cloned voice  

No ElevenLabs. No cloud TTS keys. Models download once into a local cache.

## Quick start

### 1. Start Voicebox (voice engine)

```bash
docker compose up -d --build voicebox
```

Wait until healthy:

```bash
curl http://127.0.0.1:17493/health
```

First boot downloads ML models (several GB). Keep the container running.

### 2. Start HushVoice (web UI)

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

The **UI deploys to Vercel**. Voicebox must run on a separate always-on host (VPS/Docker) — Vercel cannot run the ML models.

1. Host Voicebox with a public HTTPS URL (see [DEPLOY.md](./DEPLOY.md))
2. Import this repo in [vercel.com/new](https://vercel.com/new)
3. Set env vars:
   - `VOICEBOX_URL` = `https://your-voicebox-host`
   - `VOICEBOX_ENGINE` = `chatterbox`
4. Deploy

Full walkthrough: **[DEPLOY.md](./DEPLOY.md)**

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VOICEBOX_URL` | `http://127.0.0.1:17493` | Self-hosted Voicebox base URL |
| `VOICEBOX_ENGINE` | `chatterbox` | TTS engine (`chatterbox` recommended for multilingual cloning) |

## Languages

Aligned with Voicebox Chatterbox Multilingual: English, Hindi, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Arabic, Italian, Russian, Dutch, Turkish, Polish, Swedish, Danish, Finnish, Greek, Hebrew, Malay, Norwegian, Swahili.

## Stack

- **UI:** Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui  
- **Voice engine:** [Voicebox](https://github.com/jamiepine/voicebox) (FastAPI) — local zero-shot cloning  
- **Default model:** Chatterbox Multilingual (ResembleAI)  

## API (HushVoice → Voicebox)

| HushVoice | Voicebox |
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
| `docker compose up -d voicebox` | Start local voice engine |

## Hardware notes

Voicebox recommends several GB of RAM (compose limits default to 8GB). CPU works; GPU images (`latest-cuda` / ROCm overlay) are faster for production. See [Voicebox docs](https://github.com/jamiepine/voicebox).

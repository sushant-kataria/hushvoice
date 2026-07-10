# HushVoice

Clone your voice. Speak any language. **Fully local — no API keys.**

Record a sentence shown on screen → create a voice clone on your machine → type anything and hear it spoken back in your voice.

## How it works

1. **Record** the on-screen prompt in your language  
2. **Clone** — HushVoice creates a voice profile + reference sample on the local engine  
3. **Speak** — type any text; the engine synthesizes audio in your cloned voice  

## Install on this computer

Give your agent this file: **[docs/LOCAL_INSTALL.md](./docs/LOCAL_INSTALL.md)**

Short version:

```bash
# 1. Engine
docker compose up -d --build engine
curl -f http://127.0.0.1:17493/health

# 2. UI
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

## Use as a web app (Vercel + this Mac Mini)

Host the **UI on Vercel** and keep the **engine on the Mac Mini** (via Cloudflare Tunnel):

**[docs/VERCEL_MAC_MINI.md](./docs/VERCEL_MAC_MINI.md)**

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `HUSHVOICE_ENGINE_URL` | `http://127.0.0.1:17493` | Local HushVoice engine URL |
| `HUSHVOICE_TTS_ENGINE` | `chatterbox` | TTS model family for multilingual cloning |

## Languages

Chatterbox Multilingual: English, Hindi, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Arabic, Italian, Russian, Dutch, Turkish, Polish, Swedish, Danish, Finnish, Greek, Hebrew, Malay, Norwegian, Swahili.

## Stack

- **UI:** Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui  
- **Engine:** HushVoice FastAPI service (Docker) — local zero-shot cloning  
- **Default model:** Chatterbox Multilingual  

## Scripts

| Command | Description |
| --- | --- |
| `npm run engine` | Start local HushVoice engine (Docker) |
| `npm run engine:logs` | Tail engine logs |
| `npm run dev` | Start web UI |
| `npm run build` | Production build |
| `npm run start` | Start production UI |
| `npm run lint` | ESLint |

## Hardware

~8 GB RAM minimum (16 GB recommended). First engine boot downloads several GB of models. CPU works; a local GPU is faster if available.

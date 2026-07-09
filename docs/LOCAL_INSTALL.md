# HushVoice — Local Install (for an agent)

Install and run **HushVoice entirely on this computer**. No cloud host. No API keys. No Oracle/Vercel required.

## Goal

1. Start the **HushVoice engine** on `http://127.0.0.1:17493`
2. Start the **web UI** on `http://localhost:3000`
3. Open `/studio`, record a sentence, clone, type text, hear speech in the cloned voice

## Requirements

- Docker Desktop (or Docker Engine + Compose v2)
- Node.js 20+ and npm
- Git
- ~8 GB free RAM (16 GB recommended)
- ~10+ GB free disk (first run downloads ML models)
- Microphone access in the browser

## Steps (do in order)

### 1. Get the code

```bash
git clone https://github.com/sushant-kataria/hushvoice.git
cd hushvoice
git checkout cursor/hushvoice-voice-maker-af42
# After the PR is merged, use: git checkout main
```

If the repo already exists locally, `cd` into it and `git pull`.

### 2. Configure local env

```bash
cp .env.example .env.local
```

`.env.local` must contain (defaults are fine for local):

```bash
HUSHVOICE_ENGINE_URL=http://127.0.0.1:17493
HUSHVOICE_TTS_ENGINE=chatterbox
```

Do **not** point at a remote URL.

### 3. Start the voice engine (Docker)

```bash
docker compose up -d --build engine
```

Wait until healthy (first boot can take a long time while models download):

```bash
# repeat until this succeeds
curl -f http://127.0.0.1:17493/health
```

Useful checks:

```bash
docker compose ps
docker compose logs -f engine
```

### 4. Start the web UI

In a second terminal, from the repo root:

```bash
npm install
npm run dev
```

Open: http://localhost:3000/studio

### 5. Verify end-to-end

```bash
curl -s http://localhost:3000/api/health
```

Expect `"engineHealth": { "ok": true }` and `"apiKeysRequired": false`.

In the browser Studio:

1. Allow microphone
2. Pick a language
3. Record the on-screen sentence (≥ 3 seconds; aim 8–12)
4. Click **Generate voice clone**
5. Type text → **Speak in my voice**

Studio status should show **Engine online**.

## Optional: both services via Docker

```bash
docker compose --profile full up -d --build
```

UI: http://localhost:3000  
Engine: http://127.0.0.1:17493

## Day-to-day commands

| Action | Command |
| --- | --- |
| Start engine | `docker compose up -d engine` or `npm run engine` |
| Engine logs | `docker compose logs -f engine` or `npm run engine:logs` |
| Stop engine | `docker compose stop engine` |
| Start UI | `npm run dev` |
| Rebuild engine after pulls | `docker compose up -d --build engine` |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Studio: **Engine offline** | Start engine (`docker compose up -d engine`); confirm `curl http://127.0.0.1:17493/health` |
| `docker compose` fails | Install/start Docker Desktop; ensure Compose v2 works (`docker compose version`) |
| Port 17493 in use | Stop the other process or change the host port mapping in `docker-compose.yml` |
| Port 3000 in use | `npm run dev -- -p 3001` |
| Clone/speak very slow | Normal on CPU first run; wait for model download; keep engine running |
| Out of memory | Close other apps; raise Docker memory to ≥ 8 GB in Docker Desktop settings |
| Mic blocked | Allow mic for `localhost` in browser settings |
| `/api/voices` or `/api/speak` returns 503 | Engine not reachable at `HUSHVOICE_ENGINE_URL` |

## Architecture (local)

```
Browser (localhost:3000)
   → Next.js UI + /api/* proxy
        → HUSHVOICE_ENGINE_URL=http://127.0.0.1:17493
             → Docker service: hushvoice-engine
                  → local Chatterbox models (no API keys)
```

## Done when

- [ ] `curl http://127.0.0.1:17493/health` succeeds
- [ ] `curl http://localhost:3000/api/health` shows `engineHealth.ok: true`
- [ ] Studio shows **Engine online**
- [ ] Record → clone → speak works with the mic

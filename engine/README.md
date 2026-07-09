# HushVoice Engine

Local voice cloning & multilingual TTS server for HushVoice.

No third-party API keys. Models run on this computer.

The engine source lives in `./backend/` and ships with this repo.

## Run

```bash
docker compose up -d --build engine
curl http://127.0.0.1:17493/health
```

The web UI talks to this service via `HUSHVOICE_ENGINE_URL` (default `http://127.0.0.1:17493`).

See **[docs/LOCAL_INSTALL.md](../docs/LOCAL_INSTALL.md)** for full local setup.

## API surface (used by the web UI)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness |
| `POST` | `/profiles` | Create voice profile |
| `POST` | `/profiles/{id}/samples` | Upload reference recording |
| `GET` | `/profiles` | List profiles |
| `DELETE` | `/profiles/{id}` | Delete profile |
| `POST` | `/generate` | Start speech generation |
| `GET` | `/history/{id}` | Generation status |
| `GET` | `/audio/{id}` | Generated audio |
| `GET` | `/samples/{id}` | Reference sample audio |

Default TTS model family: **Chatterbox Multilingual** (23 languages).

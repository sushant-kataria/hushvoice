# HushVoice — Plan

Living product plan. Items here are **not implemented yet** unless marked done.

## Now (shipped)

- [x] Record → clone → speak studio flow
- [x] Self-hosted HushVoice engine (Docker, Chatterbox Multilingual)
- [x] Multi-language clone prompts + speak language selector
- [x] Local install on Mac / Windows (`docs/LOCAL_INSTALL.md`)
- [x] Optional Vercel UI + Mac Mini engine via Cloudflare Tunnel (`docs/VERCEL_MAC_MINI.md`)
- [x] Browser autoplay fallback (Play audio after generate)

## Next

### Translate-then-speak (after clone)

**Goal:** After the user has a saved voice clone, let them type in English (or another source language), translate to a target language, review/edit, then submit that text for TTS in their cloned voice.

**Why:** People think/write in English but want speech in Hindi, Spanish, etc., without typing the target script themselves.

**Proposed UX (Studio Step 3)**

1. Voice clone already selected  
2. Source text box (default English)  
3. Target language = existing Speak language dropdown  
4. **Translate** → show translated text (editable)  
5. **Speak** uses the translated (or edited) text with current `/api/speak` pipeline  

**Architecture sketch**

```
Browser → POST /api/translate { text, source, target }
              ↓
         Translate service (prefer self-hosted on Mac Mini)
              ↓
         User reviews text
              ↓
         Existing POST /api/speak → engine /generate
```

**Implementation preferences**

- Prefer **self-hosted translation** (e.g. LibreTranslate beside the engine) to keep “no paid voice API keys”  
- Cloud translate APIs are acceptable later if quality is required (separate key, not for cloning)  
- Do not change how voice profiles are stored; translation is text preprocessing only  

**Acceptance criteria**

- [ ] User with a saved clone can type English, pick target language, get a translation  
- [ ] Translated text is editable before speak  
- [ ] Speak uses translated text + existing cloned voice  
- [ ] Works with local Studio and Vercel → tunnel → Mac Mini engine  
- [ ] Clear error if translate service is offline  

**Open decisions**

- Local-only translate vs cloud API  
- Auto-detect source language vs fixed English default  
- Whether to store translation history per voice  

## Later / ideas

- [ ] Stable named Cloudflare tunnel (replace trycloudflare URLs)  
- [ ] Warm/preload Chatterbox model on engine start  
- [ ] Better first-run progress UI while models download  
- [ ] GPU path for faster generation on capable machines  

## Out of scope (for now)

- Replacing the self-hosted engine with a paid cloud TTS provider  
- Training custom models from scratch  

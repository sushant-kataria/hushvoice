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

### 1. Translate-then-speak (after clone)

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

### 2. Pricing strategy — demo cloud + lifetime local unlock ($9.99)

**Goal:** Let anyone try HushVoice in the browser for free (demo + their own clone on our hosted engine). If they want to run the full engine on their own computer forever, they pay **$9.99 once** via Stripe and get Docker download + macOS/Windows setup instructions.

#### Product tiers

| Tier | Price | What they get |
| --- | --- | --- |
| **Demo (free)** | $0 | Use the hosted web app. Try a **demo clone voice**. Create **their own clone**. Generate speech (incl. other languages / translate-then-speak when built). Limits apply (see below). Engine stays on our server — no Docker download. |
| **Lifetime local** | **$9.99 one-time** | Everything in demo, plus **download the HushVoice Docker engine**, license/unlock for local use, and **setup guides for macOS and Windows**. No recurring subscription. |

#### Demo funnel (conversion path)

```
Land on site
  → Try demo voice (no mic required) — hear quality fast
  → Record → create own clone on hosted engine
  → Type / translate → speak in their voice (other languages)
  → Hit paywall for “Run on my computer” / unlimited local use
  → Stripe Checkout ($9.99 lifetime)
  → Success page: download engine + macOS / Windows install docs
```

#### Suggested free-tier limits (open to tune)

- [ ] Cap generations per day (e.g. 10 speaks / day)  
- [ ] Cap clone count (e.g. 1–2 voices)  
- [ ] Cap text length on free speak  
- [ ] Watermark or short demo banner (optional, keep tasteful)  
- [ ] No engine binary / compose package download until paid  

Paid users: unlock download + remove cloud caps for local engine (cloud demo can stay available or also unlock higher limits).

#### Stripe integration (plan)

**Checkout**

- Stripe Checkout Session, mode: `payment` (one-time)  
- Price: **$9.99 USD** lifetime  
- Success URL → `/account/unlock` or `/download` with session id  
- Cancel URL → pricing / studio CTA  

**After payment**

- Webhook `checkout.session.completed` → mark customer/email (or account) as `lifetime_unlocked`  
- Issue a **download token** or signed URL for the engine package  
- Show **macOS** and **Windows** setup instructions (link to or fork of `docs/LOCAL_INSTALL.md`, split per OS)  

**Customer identity (open decision)**

- Minimal: email from Stripe Checkout (no full auth) + magic link to re-access downloads  
- Or: simple account (email/password or magic link) so they can return for docs/downloads  

**Env / secrets (when implementing)**

- `STRIPE_SECRET_KEY`  
- `STRIPE_WEBHOOK_SECRET`  
- `STRIPE_PRICE_ID` (or hardcoded amount for $9.99)  
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  

#### Download & install after purchase

Deliverables for paid users:

1. **Engine package** — Docker Compose + image instructions (or pull from private registry / GitHub Release asset)  
2. **macOS setup guide** — Docker Desktop, Rosetta if needed, `docker compose up`, health check, Studio pointing at `localhost`  
3. **Windows setup guide** — Docker Desktop + WSL2, RAM notes (8 GB tight / 16 GB recommended), same compose flow  
4. Optional: license key file or env flag `HUSHVOICE_LICENSE=…` if we want soft enforcement later  

#### UI surfaces to add

- [ ] Pricing page (`/pricing`) — Demo vs Lifetime $9.99  
- [ ] Studio CTAs — “Try demo voice”, “Unlock local engine — $9.99”  
- [ ] Post-checkout download + docs page  
- [ ] Account / “Access my download” (email magic link if no full auth)  

#### Architecture sketch

```
Free user → Vercel UI → our hosted engine (demo + limited clones)
Paid user → Stripe Checkout ($9.99)
         → webhook unlocks download
         → user runs engine on their Mac/Windows
         → optional: still use Vercel UI with HUSHVOICE_ENGINE_URL=localhost
                    or run UI locally via npm run dev
```

#### Acceptance criteria

- [ ] Anonymous user can speak with a **demo clone** without paying  
- [ ] Anonymous/free user can **create one clone** and generate multilingual TTS on hosted engine (within limits)  
- [ ] “Buy lifetime — $9.99” starts Stripe Checkout  
- [ ] Successful payment unlocks engine download + macOS/Windows instructions  
- [ ] Webhook is verified; unpaid users cannot download the engine package  
- [ ] Paid user can re-open download/docs later (email link or account)  

#### Open decisions

- Exact free caps (daily speaks, clones, char limit)  
- Auth model: Stripe email only vs full accounts  
- How engine is distributed (public Docker Hub vs private release after pay)  
- Whether paid also raises hosted-cloud limits or hosted stays demo-only  
- Refund / support policy for lifetime purchase  

#### Compliance / trust

- Clear “one-time lifetime for local engine license/download” copy  
- Privacy: voice samples on hosted demo — retention policy (delete after N days?)  
- Stripe Customer Portal optional (receipts); no subscription cancel flow needed  

## Later / ideas

- [ ] Stable named Cloudflare tunnel (replace trycloudflare URLs)  
- [ ] Warm/preload Chatterbox model on engine start  
- [ ] Better first-run progress UI while models download  
- [ ] GPU path for faster generation on capable machines  
- [ ] Team / volume licenses (if lifetime $9.99 solo isn’t enough later)  

## Out of scope (for now)

- Replacing the self-hosted engine with a paid cloud TTS provider as the primary product  
- Training custom models from scratch  
- Monthly subscription (lifetime one-time is the v1 monetization)  

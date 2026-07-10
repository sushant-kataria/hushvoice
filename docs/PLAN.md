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

### 2. Pricing strategy (revised) — sell hosted access, not the engine binary

#### Why the old idea was weak

Selling **Docker engine download for $9.99 lifetime** is easy to defeat:

- Anyone who pays once can **copy the image**, re-upload it, or share the compose file  
- License keys on a local Docker container are **honor-system** — determined users bypass them  
- At $9.99, resellers / “cracked” mirrors are economically rational  
- Your real cost is **GPU/CPU hosting + support + product UX**, not a secret `.tar` file  

**Do not make “download the engine” the thing people pay for.** Make **convenient, reliable hosted usage** the product.

#### Ideal model (recommended)

| Tier | Price (starting point) | What they get |
| --- | --- | --- |
| **Free demo** | $0 | Hosted app only. **Demo voice** (no mic). Optionally **1 short personal clone**. Hard caps on speaks/day and text length. Watermark or “Demo” badge in UI. **No** engine download. |
| **Pro (hosted)** | **~$9.99/month** *or* credit packs (e.g. $9.99 → N generations) | Hosted clone + multilingual speak (+ translate-then-speak). Higher limits, saved voices, no watermark. Stripe subscription or prepaid credits. **Engine stays on our servers.** |
| **Local / power user** (optional later) | Higher one-time or annual (e.g. **$49–99**) **or free open-source engine** | Self-host for privacy/offline. Position as **convenience + docs + updates**, not DRM. Accept some sharing; revenue still comes from Pro hosted. |

**Primary revenue = Pro hosted (Stripe).**  
**Local Docker = secondary** (privacy nerds / offline), not the moat.

#### Why this works

```
You keep the expensive part (running Chatterbox)
Users pay for convenience (no Docker, works on phone, always on)
Copying the website doesn’t give them free unlimited inference
Piracy of a local image doesn’t bankrupt your cloud bill
```

#### Demo funnel (conversion path)

```
Land on site
  → Speak with demo clone (instant “wow”)
  → Record → create own clone (limited)
  → Translate English → target language → speak
  → Hit limit / want more voices / longer text
  → Stripe: subscribe or buy credits
  → Keep using hosted Studio (Vercel → your engine)
```

Optional later CTA: “Prefer offline? Self-host guide” (paid docs pack or open source) — **not** the main checkout.

#### Free-tier limits (tune with data)

- [ ] Demo voice: unlimited or high cap (cheap acquisition)  
- [ ] Personal clones: 1 on free  
- [ ] Speaks/day: e.g. 5–10  
- [ ] Max characters per speak  
- [ ] Clones/voices deleted after N days of inactivity (cost + privacy)  

#### Stripe integration (plan)

**Preferred v1**

- Stripe Checkout, mode: **`subscription`** (e.g. $9.99/mo Pro)  
  **or** mode: **`payment`** for credit packs (simpler ops, no churn management at first)  

**After payment**

- Webhook → set `plan=pro` or add credit balance on user/email  
- Hosted `/api/clone` and `/api/speak` check entitlement before calling the engine  
- Customer Portal for cancel/receipts if subscription  

**Identity**

- Simple auth (magic link email) so limits and purchases stick across devices  

**Env (when implementing)**

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`  
- `STRIPE_PRICE_ID` (subscription and/or credit pack)  
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  

#### What we explicitly do *not* sell as the core product

- ~~$9.99 lifetime Docker download as the only paid tier~~ (superseded — too easy to copy/resell)  
- DRM’d “secret” engine images as the business  

Local install docs can remain for **your** Mac Mini / power users; public “buy the binary” is optional and never the main lock.

#### UI surfaces to add

- [ ] `/pricing` — Free demo vs Pro hosted  
- [ ] Studio: demo voice CTA, limit banners, upgrade to Pro  
- [ ] Account: plan status, credits, Stripe portal  
- [ ] (Later) Self-host docs link — not behind the same $9.99 “download everything” paywall  

#### Architecture sketch

```
Free/Pro users → Vercel UI → entitlement check → our hosted engine
                      ↑
                 Stripe (subscription or credits)

Self-host (optional) → user’s machine; not required for Pro value
```

#### Acceptance criteria

- [ ] Demo voice works without signup/payment  
- [ ] Free user can create a limited personal clone and speak (incl. other languages when translate ships)  
- [ ] Over-limit requests are blocked with upgrade CTA  
- [ ] Stripe unlocks Pro / credits; webhook verified  
- [ ] Unpaid users cannot burn unlimited hosted GPU/CPU  
- [ ] Product copy does not promise an un-copyable local binary  

#### Open decisions

- Subscription vs credit packs for v1 (credits = simpler; sub = recurring revenue)  
- Exact price points ($9.99/mo vs $4.99/mo vs $9.99 for 100 speaks)  
- Whether self-host is free/open, paid support, or deferred  
- Voice data retention on free tier  

#### Compliance / trust

- Clear hosted vs self-host messaging  
- Privacy policy for voice samples on our servers  
- Stripe receipts; refund policy for credits/subs  

## Later / ideas

- [ ] Stable named Cloudflare tunnel (replace trycloudflare URLs)  
- [ ] Warm/preload Chatterbox model on engine start  
- [ ] Better first-run progress UI while models download  
- [ ] GPU path for faster generation on capable machines  
- [ ] Team seats / API access for Pro  
- [ ] Optional self-host “supporter” license (docs + updates), knowing redistribution risk  

## Out of scope (for now)

- Replacing the engine with a third-party cloud TTS as the core product  
- Training custom models from scratch  
- Relying on DRM of a Docker image as the business model  
- $9.99 lifetime engine download as primary monetization (rejected — see pricing revised)  

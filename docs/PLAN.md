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

#### How to restrict usage (enforcement)

Limits only work if checked **on the server before** calling the engine. The Studio UI can show banners; the browser can be bypassed. Today `/api/clone` and `/api/speak` are open — that must change before public Pro.

```
User → Vercel /api/speak|/api/clone
         1. Who are you?     (session / magic-link cookie)
         2. What plan?       (free | pro | credits left)
         3. Under cap?       (speaks today, clones, chars, concurrency)
         4. OK → engine
            DENY → 402/429 + upgrade CTA
```

**1. Identity (required)**

- Magic-link or email OTP → httpOnly session cookie  
- Anonymous free demo: allow **demo voice only** keyed by IP + cookie fingerprint (easy to burn; keep caps low)  
- Personal clone / Pro: require signed-in user  

**2. Entitlement store**

Per user (DB or KV: Vercel KV / Postgres / Turso):

| Field | Example |
| --- | --- |
| `plan` | `free` \| `pro` |
| `credits` | integer (if using packs) |
| `speaks_today` / `speaks_day_key` | counter + UTC date |
| `clone_count` | active personal voices |
| `stripe_customer_id` | for portal |

Stripe webhook writes `plan` / `credits`. Speak/clone routes **decrement or reject**.

**3. Hard rules to enforce in API**

| Check | Free | Pro (starting point) |
| --- | --- | --- |
| Demo voice speaks | High / soft cap | Unlimited-ish |
| Personal clones | **1** | e.g. 5–10 |
| Speaks / day | **5–10** | e.g. 200 or credit-metered |
| Max chars / speak | e.g. **300** | e.g. 2000 |
| Concurrent generates | **1** | 1–2 |
| Engine access | Only via Vercel API | Same |

On deny: `429` (rate) or `402` (paywall) with `{ error, code: "LIMIT_SPEAKS", upgrade: true }`.

**4. Credit packs (simplest COGS control)**

- Buy pack → `credits += N`  
- Each successful speak → `credits -= 1` (or weighted by char length)  
- `credits <= 0` → block speak (clone can stay free/limited)  
- Subscription Pro can mean “refill N credits/month” or “soft unlimited under fair-use”

**5. Lock the engine URL (critical)**

If `engine.yourdomain.com` / RunPod is public, people skip Vercel and burn GPU.

- Engine shared secret: Vercel sends `Authorization: Bearer $ENGINE_API_KEY`; engine rejects others  
- Or Cloudflare Access / tunnel only from Vercel egress (harder)  
- Prefer **secret header** on FastAPI middleware — cheap and enough for v1  

**6. Concurrent + abuse**

- Global queue depth on engine (reject when busy)  
- Per-user lock during generate  
- Block obvious abuse: empty spam, same text flood, huge uploads  

**v1 implementation order**

1. Engine API key (stop open engine)  
2. Session auth + user row  
3. Caps on `/api/speak` and `/api/clone`  
4. Stripe webhook → Pro/credits  
5. Studio UI for remaining quota / upgrade  

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

### 3. Compute plan — where inference actually runs

Vercel only hosts the **Next.js UI**. Chatterbox needs a long-lived machine with RAM/CPU (ideally GPU). That machine is **your** cost of goods; Stripe Pro/credits must cover it.

#### Phase A — Launch / early users (what you have now)

**Your Mac Mini is the compute.**

```
Paying + free users → Vercel → Cloudflare Tunnel → Mac Mini Docker engine
```

- Keep Mac Mini awake, Docker `engine` up, named tunnel stable (`docs/VERCEL_MAC_MINI.md`)
- Free-tier caps + Pro entitlements so one viral day doesn’t lock your Mini forever
- Expect **slow CPU generation**; fine for demos and a handful of Pro users
- Cap concurrent jobs (queue of 1–2) so the machine doesn’t thrash

**When this breaks:** queue wait too long, Mac overheats, home uplink dies, or you need 24/7 uptime while traveling.

#### Phase B — Real hosted product (when Stripe revenue starts)

**Rent a cloud GPU (or strong CPU) and point `HUSHVOICE_ENGINE_URL` at it.** Same Docker engine image — only the host changes.

| Option | Role | Notes |
| --- | --- | --- |
| **RunPod / Vast.ai / Lambda** | Cheap GPU pods | Good for TTS; spot pricing; you manage Docker + tunnel or public URL |
| **Modal / Replicate-style** | Serverless GPU | Pay per second; cold starts; good if traffic is spiky |
| **Fly.io / Railway / Render** | Always-on CPU (or GPU if available) | Simpler ops; slower/more expensive per speak than a dedicated GPU |
| **Small cloud VM + GPU** (AWS/GCP/Azure) | Enterprise path | More ops; only when you outgrow pods |

Recommended default for Phase B: **one always-on GPU pod** (e.g. RunPod) running `hushvoice-engine`, HTTPS endpoint, Vercel env updated. Keep Mac Mini as **dev / failover**, not production.

#### Phase C — Scale (many Pro users)

- Job queue (Redis) + 1→N engine workers  
- Separate **demo** vs **Pro** pools so free users can’t starve paying ones  
- Autoscale workers on queue depth; shut down idle GPUs overnight if using credit packs / low night traffic  
- Optional CDN/cache for identical demo-voice speaks only  

#### How money maps to compute

```
Free user speak  → capped; paid from your margin / marketing budget
Pro $9.99/mo     → must cover (their speaks × cost per speak) + overhead
Credit pack      → easiest COGS control: N credits ≈ N GPU-seconds reserved
```

Rule of thumb before raising limits: measure **seconds of GPU time per speak** on your box, price credits so **revenue ≥ ~3–5× compute** after Stripe fees.

#### What you do *not* need

- Vercel Pro / serverless ML — Vercel will not run Chatterbox  
- Buying GPUs on day one — Mac Mini validates the product; cloud GPU is the scale-up  
- Giving every customer their own GPU — one shared engine + entitlement caps is enough until load demands more  

#### Acceptance criteria (compute)

- [ ] Documented Phase A path (Mini + tunnel) works for demo + early Pro  
- [ ] `HUSHVOICE_ENGINE_URL` can switch from Mini → cloud GPU without app rewrite  
- [ ] Free/Pro limits prevent unbounded spend on whatever host you use  
- [ ] Rough cost-per-speak known before opening Pro publicly  

#### Open decisions

- First cloud host (RunPod vs Modal vs other) when leaving the Mac Mini  
- Always-on GPU vs serverless (latency vs cost)  
- Whether demo voice runs on a cheaper CPU box and Pro on GPU  

#### Stripe → RunPod automation (yes, but not “one GPU per buyer”)

RunPod can be started from code ([REST API](https://docs.runpod.io/api-reference/pods/POST/pods) / `create_pod` / `resume_pod`). Stripe can call your app on payment (`checkout.session.completed`, `invoice.paid`). Wire them together — **do not** spawn a dedicated pod for every $9.99 customer.

**Recommended patterns**

| Pattern | What Stripe payment does | Compute behavior | Fit |
| --- | --- | --- | --- |
| **A. Entitlement only (best default)** | Set `plan=pro` / add credits | Shared engine already running (Mini or one RunPod). Payment never touches RunPod. | Early Pro; predictable |
| **B. Wake shared pod** | Unlock Pro **and** if no GPU is up → `resume_pod` / `POST /pods` once | One shared pod for all Pro users; stop after N minutes idle | Save money overnight |
| **C. RunPod Serverless** | Unlock Pro / credits | Each `/speak` → RunPod `/run`; workers scale 0→N automatically | Spiky traffic; pay per job |
| **D. Per-user pod** | Create a pod for that customer | Expensive, slow cold start, ops hell at $9.99 | Only high-ticket / dedicated |

```
Stripe webhook (payment success)
        │
        ▼
Your Vercel/API route
  1. Verify signature
  2. Mark user Pro / add credits     ← always do this
  3. Optional: ensureSharedGpu()     ← B only
        │
        ▼
RunPod API (shared): create/resume/stop ONE pod
        or
Serverless endpoint (C): no pod lifecycle in webhook
```

**What to implement first:** Pattern **A** (Stripe unlocks access; Mac Mini or one always-on RunPod). Add **B** or **C** when you care about idle GPU cost.

**Env when automating B/C**

- `STRIPE_*` (existing)  
- `RUNPOD_API_KEY`  
- `RUNPOD_POD_ID` or `RUNPOD_TEMPLATE_ID` / serverless `RUNPOD_ENDPOINT_ID`  
- Optional: store live engine URL in DB/KV after wake; Vercel reads it (or fixed subdomain via tunnel/proxy)

**Do not**

- Create a new RunPod on every Checkout — margin dies  
- Block the user’s browser on “waiting for GPU provision” for minutes without a clear UI  
- Put `RUNPOD_API_KEY` in client-side code  

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

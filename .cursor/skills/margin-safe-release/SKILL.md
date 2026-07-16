---
name: margin-safe-release
description: Checklist for shipping HushVoice hosted billing without going negative on GPU cost.
---

# Margin-safe release

## Before public Pro

1. Measure cost per speak on target hardware.
2. Confirm credit pack price ≥ 4× COGS after Stripe fees.
3. Set `HUSHVOICE_BILLING_MODE=metered`.
4. Set matching `ENGINE_API_KEY` / `HUSHVOICE_ENGINE_API_KEY` on engine + Vercel.
5. Configure Stripe keys + webhook → `/api/billing/webhook`.
6. Use remote `HUSHVOICE_DATABASE_URL` (Turso) on Vercel — not ephemeral `/tmp`.
7. Smoke test: free speak cap → 402; buy credits → speak decrements; engine rejects missing Bearer.

## Never

- Unlimited Pro at $9.99
- Public engine URL without API key
- Always-on RunPod before prepaid revenue covers it

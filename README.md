# HushVoice

Clone your voice. Speak any language.

Record a sentence shown on screen → generate a personal voice clone → type anything and hear it spoken back in your voice. Built with [shadcn/ui](https://ui.shadcn.com) and inspired by the craft of [Sarvam](https://www.sarvam.ai).

## Features

- **Record → Clone → Speak** studio flow
- **12 languages** with localized clone prompts (English, Hindi, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Arabic, Tamil, Bengali)
- **Voice profiles** saved locally under `.data/voices`
- **Browser multilingual TTS** pitched to match your sample
- **Optional ElevenLabs** cloud TTS when `ELEVENLABS_API_KEY` is set

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then go to **Studio**.

## Optional cloud TTS

Copy `.env.example` to `.env.local` and set:

```bash
ELEVENLABS_API_KEY=your_key
```

Without a key, HushVoice uses the Web Speech API with pitch/rate matched to your recording.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova)
- Framer Motion
- Local filesystem voice store (Node runtime API routes)

## Scripts

| Command       | Description        |
| ------------- | ------------------ |
| `npm run dev` | Start dev server   |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run lint`  | ESLint           |

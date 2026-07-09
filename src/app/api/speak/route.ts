import { NextResponse } from "next/server";
import { getVoice, voiceAudioPath } from "@/lib/voices";
import { getLanguage } from "@/lib/languages";
import { promises as fs } from "fs";

export const runtime = "nodejs";

/**
 * Returns metadata + reference audio for client-side synthesis.
 * Browser SpeechSynthesis is used for multilingual TTS, pitched to match
 * the cloned sample. When ELEVENLABS_API_KEY (or similar) is present,
 * this route can be extended to call a cloud clone/TTS provider.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      voiceId?: string;
      text?: string;
      language?: string;
    };

    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Text must be under 2000 characters" },
        { status: 400 }
      );
    }

    if (!body.voiceId) {
      return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
    }

    const voice = await getVoice(body.voiceId);
    if (!voice) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    const languageCode = body.language || voice.language;
    const language = getLanguage(languageCode);

    // Optional cloud TTS path (ElevenLabs instant voice clone)
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (elevenKey) {
      try {
        const audioPath = voiceAudioPath(voice);
        const sample = await fs.readFile(audioPath);

        // Ensure a cloned voice exists on ElevenLabs for this profile
        let elevenVoiceId = process.env[`ELEVEN_VOICE_${voice.id}`];

        if (!elevenVoiceId) {
          const form = new FormData();
          form.append("name", `hushvoice-${voice.id.slice(0, 8)}`);
          form.append(
            "files",
            new Blob([new Uint8Array(sample)], { type: "audio/webm" }),
            voice.audioFile
          );
          form.append(
            "description",
            `HushVoice clone for ${voice.name} (${language.code})`
          );

          const cloneRes = await fetch(
            "https://api.elevenlabs.io/v1/voices/add",
            {
              method: "POST",
              headers: { "xi-api-key": elevenKey },
              body: form,
            }
          );

          if (cloneRes.ok) {
            const cloned = (await cloneRes.json()) as { voice_id?: string };
            elevenVoiceId = cloned.voice_id;
          }
        }

        if (elevenVoiceId) {
          const ttsRes = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": elevenKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
              },
              body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
              }),
            }
          );

          if (ttsRes.ok) {
            const audio = Buffer.from(await ttsRes.arrayBuffer());
            return new NextResponse(audio, {
              headers: {
                "Content-Type": "audio/mpeg",
                "X-HushVoice-Engine": "elevenlabs",
                "X-HushVoice-Language": language.code,
              },
            });
          }
        }
      } catch (cloudErr) {
        console.warn("Cloud TTS unavailable, falling back", cloudErr);
      }
    }

    // Default: instruct client to synthesize with browser + voice print
    return NextResponse.json({
      mode: "browser",
      text,
      language: language.code,
      speechLocale: language.speechLocale,
      voiceId: voice.id,
      referenceUrl: `/api/voices/${voice.id}/audio`,
      hint: "Use the reference sample to estimate pitch, then speak via SpeechSynthesis.",
    });
  } catch (err) {
    console.error("speak error", err);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

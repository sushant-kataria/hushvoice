import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import {
  fetchGenerationAudio,
  getProfile,
  startGeneration,
  toVoiceboxLanguage,
  VoiceboxError,
  waitForGeneration,
} from "@/lib/voicebox";

export const runtime = "nodejs";

/**
 * Generate speech with the self-hosted Voicebox engine (Chatterbox Multilingual).
 * No API keys — models run on your machine / server.
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
    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text must be under 5000 characters" },
        { status: 400 }
      );
    }

    if (!body.voiceId) {
      return NextResponse.json({ error: "voiceId is required" }, { status: 400 });
    }

    const profile = await getProfile(body.voiceId);
    if (!profile) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    const languageCode = body.language || profile.language;
    const language = getLanguage(languageCode);
    const vbLang = toVoiceboxLanguage(languageCode);

    const generation = await startGeneration({
      profileId: profile.id,
      text,
      language: vbLang,
      engine: profile.default_engine || "chatterbox",
    });

    const done = await waitForGeneration(generation.id, {
      timeoutMs: 10 * 60 * 1000,
      intervalMs: 1200,
    });

    const { buffer, contentType } = await fetchGenerationAudio(done.id);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "X-HushVoice-Engine": done.engine || "chatterbox",
        "X-HushVoice-Language": language.code,
        "X-HushVoice-Backend": "voicebox",
        "X-HushVoice-Generation-Id": done.id,
      },
    });
  } catch (err) {
    if (err instanceof VoiceboxError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("speak error", err);
    return NextResponse.json(
      { error: "Failed to generate speech with Voicebox" },
      { status: 500 }
    );
  }
}

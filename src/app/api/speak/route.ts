import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import {
  fetchGenerationAudio,
  getProfile,
  startGeneration,
  toEngineLanguage,
  EngineError,
  waitForGeneration,
} from "@/lib/engine";
import {
  EntitlementError,
  assertCanSpeak,
  consumeSpeak,
  entitlementResponse,
} from "@/lib/billing/entitlements";
import { getOrCreateSessionUser } from "@/lib/billing/session";

export const runtime = "nodejs";
/** Allow longer waits on Pro / local; Hobby still caps lower. Prefer async poll. */
export const maxDuration = 60;

/**
 * Start (and optionally wait for) speech generation on the HushVoice engine.
 *
 * Body: { voiceId, text, language?, wait?: boolean }
 * - wait=false (default): returns { generationId, status } immediately (client polls)
 * - wait=true: blocks until audio is ready and returns the audio bytes
 */
export async function POST(request: Request) {
  try {
    const { user } = await getOrCreateSessionUser();

    const body = (await request.json()) as {
      voiceId?: string;
      text?: string;
      language?: string;
      wait?: boolean;
    };

    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const { maxChars } = await assertCanSpeak(user.id, text.length);
    if (text.length > maxChars) {
      return NextResponse.json(
        {
          error: `Text must be under ${maxChars} characters on your plan.`,
          code: "LIMIT_CHARS",
          upgrade: true,
        },
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
    const engineLang = toEngineLanguage(languageCode);

    const generation = await startGeneration({
      profileId: profile.id,
      text,
      language: engineLang,
      engine: profile.default_engine || "chatterbox",
    });

    const quota = await consumeSpeak(user.id);

    const shouldWait = body.wait === true;

    if (!shouldWait) {
      return NextResponse.json({
        generationId: generation.id,
        status: generation.status || "generating",
        language: language.code,
        engine: generation.engine || profile.default_engine || "chatterbox",
        backend: "hushvoice",
        quota,
      });
    }

    const done = await waitForGeneration(generation.id, {
      timeoutMs: 55_000,
      intervalMs: 1200,
    });

    const { buffer, contentType } = await fetchGenerationAudio(done.id);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "X-HushVoice-Engine": done.engine || "chatterbox",
        "X-HushVoice-Language": language.code,
        "X-HushVoice-Backend": "hushvoice",
        "X-HushVoice-Generation-Id": done.id,
        "X-HushVoice-Credits": String(quota.credits),
      },
    });
  } catch (err) {
    if (err instanceof EntitlementError) {
      return NextResponse.json(entitlementResponse(err), { status: err.status });
    }
    if (err instanceof EngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("speak error", err);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}

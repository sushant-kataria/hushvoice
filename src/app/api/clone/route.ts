import { NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import {
  addProfileSample,
  createProfile,
  deleteProfile,
  toEngineLanguage,
  EngineError,
} from "@/lib/engine";
import {
  EntitlementError,
  assertCanClone,
  entitlementResponse,
  getQuota,
  recordClone,
} from "@/lib/billing/entitlements";
import { getOrCreateSessionUser } from "@/lib/billing/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_DURATION_MS = 2500;
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Create a HushVoice cloned profile from the user's recording.
 * Entirely self-hosted — no third-party API keys.
 */
export async function POST(request: Request) {
  let createdProfileId: string | null = null;

  try {
    const { user } = await getOrCreateSessionUser();
    await assertCanClone(user.id);

    const form = await request.formData();
    const audio = form.get("audio");
    const language = String(form.get("language") || "en");
    const name = String(form.get("name") || "My Voice");
    const durationMs = Number(form.get("durationMs") || 0);
    const prompt =
      String(form.get("prompt") || "") || getLanguage(language).prompt;

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Audio recording is required" },
        { status: 400 }
      );
    }

    if (durationMs > 0 && durationMs < MIN_DURATION_MS) {
      return NextResponse.json(
        {
          error: `Please record at least ${Math.ceil(MIN_DURATION_MS / 1000)} seconds of clear speech.`,
        },
        { status: 400 }
      );
    }

    if (audio.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Recording is too large. Try a shorter clip." },
        { status: 400 }
      );
    }

    const engineLang = toEngineLanguage(language);
    const mime = audio.type || "audio/webm";
    const ext = mime.includes("mp4")
      ? "m4a"
      : mime.includes("ogg")
        ? "ogg"
        : mime.includes("wav")
          ? "wav"
          : "webm";

    const profile = await createProfile({
      name: name.trim() || "My Voice",
      language: engineLang,
      description: prompt,
      default_engine: "chatterbox",
    });
    createdProfileId = profile.id;

    const buffer = Buffer.from(await audio.arrayBuffer());
    await addProfileSample({
      profileId: profile.id,
      audio: buffer,
      filename: `sample.${ext}`,
      contentType: mime,
      referenceText: prompt,
    });

    const updated = await recordClone(user.id);
    const quota = await getQuota(updated);

    return NextResponse.json({
      voice: {
        id: profile.id,
        name: profile.name,
        language: language,
        prompt,
        createdAt: profile.created_at,
        durationMs: durationMs || 0,
        engine: "chatterbox",
        backend: "hushvoice",
      },
      quota,
      message:
        "Voice clone ready on your HushVoice engine. Type anything and hear it in your voice.",
    });
  } catch (err) {
    if (createdProfileId) {
      try {
        await deleteProfile(createdProfileId);
      } catch {
        // best-effort cleanup
      }
    }

    if (err instanceof EntitlementError) {
      return NextResponse.json(entitlementResponse(err), { status: err.status });
    }
    if (err instanceof EngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("clone error", err);
    return NextResponse.json(
      { error: "Failed to create voice clone" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { saveVoice } from "@/lib/voices";
import { getLanguage } from "@/lib/languages";

export const runtime = "nodejs";

const MIN_DURATION_MS = 2500;
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const language = String(form.get("language") || "en");
    const name = String(form.get("name") || "My Voice");
    const durationMs = Number(form.get("durationMs") || 0);
    const sampleRate = Number(form.get("sampleRate") || 48000);
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

    const buffer = Buffer.from(await audio.arrayBuffer());
    const mime = audio.type || "audio/webm";
    const ext = mime.includes("mp4")
      ? "m4a"
      : mime.includes("ogg")
        ? "ogg"
        : mime.includes("wav")
          ? "wav"
          : "webm";

    const voice = await saveVoice({
      name,
      language,
      prompt,
      durationMs: durationMs || 0,
      sampleRate: sampleRate || 48000,
      audioBuffer: buffer,
      ext,
    });

    return NextResponse.json({
      voice,
      message:
        "Voice clone ready. Type anything and HushVoice will speak in your voice.",
    });
  } catch (err) {
    console.error("clone error", err);
    return NextResponse.json(
      { error: "Failed to create voice clone" },
      { status: 500 }
    );
  }
}

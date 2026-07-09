import { NextResponse } from "next/server";
import {
  deleteProfile,
  listProfiles,
  listProfileSamples,
  VoiceboxError,
} from "@/lib/voicebox";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profiles = await listProfiles();
    const voices = await Promise.all(
      profiles
        .filter((p) => (p.voice_type || "cloned") === "cloned")
        .map(async (p) => {
          let durationMs = 0;
          try {
            const samples = await listProfileSamples(p.id);
            // Voicebox doesn't expose duration on samples; keep 0 unless known
            durationMs = samples.length ? 0 : 0;
          } catch {
            // ignore
          }
          return {
            id: p.id,
            name: p.name,
            language: p.language,
            prompt: p.description || "",
            createdAt: p.created_at,
            durationMs,
            sampleCount: p.sample_count ?? 0,
            engine: p.default_engine || "chatterbox",
          };
        })
    );

    return NextResponse.json({ voices, backend: "voicebox" });
  } catch (err) {
    if (err instanceof VoiceboxError) {
      return NextResponse.json({ error: err.message, voices: [] }, { status: err.status });
    }
    console.error("list voices", err);
    return NextResponse.json(
      { error: "Failed to list voices", voices: [] },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing voice id" }, { status: 400 });
  }
  try {
    await deleteProfile(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof VoiceboxError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to delete voice" }, { status: 500 });
  }
}

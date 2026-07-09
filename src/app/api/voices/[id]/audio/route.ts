import { NextResponse } from "next/server";
import {
  fetchSampleAudio,
  getProfile,
  listProfileSamples,
  EngineError,
} from "@/lib/engine";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const profile = await getProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    const samples = await listProfileSamples(id);
    if (!samples.length) {
      return NextResponse.json({ error: "No sample audio" }, { status: 404 });
    }

    const { buffer, contentType } = await fetchSampleAudio(samples[0].id);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    if (err instanceof EngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Audio missing" }, { status: 404 });
  }
}

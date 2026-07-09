import { NextResponse } from "next/server";
import {
  fetchGenerationAudio,
  getGeneration,
  EngineError,
} from "@/lib/engine";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Poll generation status, or fetch audio when complete.
 * GET /api/speak/{generationId}
 * GET /api/speak/{generationId}?audio=1  → audio bytes when ready
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const wantAudio = new URL(request.url).searchParams.get("audio") === "1";

  try {
    const gen = await getGeneration(id);
    if (!gen) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (wantAudio) {
      if (gen.status !== "completed") {
        return NextResponse.json(
          {
            error: "Audio not ready",
            status: gen.status,
            generationId: gen.id,
          },
          { status: 202 }
        );
      }
      const { buffer, contentType } = await fetchGenerationAudio(gen.id);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "X-HushVoice-Engine": gen.engine || "chatterbox",
          "X-HushVoice-Backend": "hushvoice",
          "X-HushVoice-Generation-Id": gen.id,
        },
      });
    }

    return NextResponse.json({
      generationId: gen.id,
      status: gen.status,
      error: gen.error ?? null,
      duration: gen.duration ?? null,
      engine: gen.engine || "chatterbox",
      language: gen.language,
    });
  } catch (err) {
    if (err instanceof EngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Failed to fetch generation status" },
      { status: 500 }
    );
  }
}

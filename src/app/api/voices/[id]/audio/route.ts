import { NextResponse } from "next/server";
import { getVoice, voiceAudioPath } from "@/lib/voices";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const voice = await getVoice(id);
  if (!voice) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }

  try {
    const filePath = voiceAudioPath(voice);
    const data = await fs.readFile(filePath);
    const ext = path.extname(voice.audioFile).toLowerCase();
    return new NextResponse(data, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio missing" }, { status: 404 });
  }
}

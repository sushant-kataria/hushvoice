import { NextResponse } from "next/server";
import { DEFAULT_ENGINE, getVoiceboxHealth, VOICEBOX_URL } from "@/lib/voicebox";

export const runtime = "nodejs";

export async function GET() {
  const health = await getVoiceboxHealth();
  return NextResponse.json({
    hushvoice: "ok",
    engine: DEFAULT_ENGINE,
    voicebox: health,
    voiceboxUrl: VOICEBOX_URL,
    mode: "self-hosted",
    apiKeysRequired: false,
  });
}

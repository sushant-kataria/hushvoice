import { NextResponse } from "next/server";
import { DEFAULT_ENGINE, getEngineHealth, ENGINE_URL } from "@/lib/engine";

export const runtime = "nodejs";

export async function GET() {
  const health = await getEngineHealth();
  return NextResponse.json({
    hushvoice: "ok",
    engine: DEFAULT_ENGINE,
    engineHealth: health,
    engineUrl: ENGINE_URL,
    mode: "self-hosted",
    apiKeysRequired: false,
  });
}

import { NextResponse } from "next/server";
import { listVoices, deleteVoice } from "@/lib/voices";

export const runtime = "nodejs";

export async function GET() {
  const voices = await listVoices();
  return NextResponse.json({ voices });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing voice id" }, { status: 400 });
  }
  const ok = await deleteVoice(id);
  if (!ok) {
    return NextResponse.json({ error: "Voice not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

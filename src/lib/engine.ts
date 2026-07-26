/**
 * Client for the self-hosted HushVoice engine.
 * Cloning + TTS run on this computer — no third-party API keys.
 */

export const ENGINE_URL = (
  process.env.HUSHVOICE_ENGINE_URL || "http://127.0.0.1:17493"
).replace(/\/$/, "");

/** Default TTS model family for zero-shot multilingual cloning. */
export const DEFAULT_ENGINE = process.env.HUSHVOICE_TTS_ENGINE || "chatterbox";

export type EngineProfile = {
  id: string;
  name: string;
  description?: string | null;
  language: string;
  voice_type?: string;
  default_engine?: string | null;
  sample_count?: number;
  generation_count?: number;
  created_at: string;
  updated_at?: string;
};

export type EngineSample = {
  id: string;
  profile_id: string;
  audio_path: string;
  reference_text: string;
};

export type EngineGeneration = {
  id: string;
  profile_id: string;
  text: string;
  language: string;
  audio_path?: string | null;
  duration?: number | null;
  status: string;
  error?: string | null;
  engine?: string | null;
  created_at?: string;
};

export class EngineError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "EngineError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown; error?: string };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: string }).msg)
            : JSON.stringify(d)
        )
        .join("; ");
    }
    if (data.error) return data.error;
  } catch {
    // ignore
  }
  return res.statusText || `HushVoice engine error (${res.status})`;
}

/** Shared secret so clients cannot bypass Vercel metering and hit the engine directly. */
export const ENGINE_API_KEY =
  process.env.HUSHVOICE_ENGINE_API_KEY ||
  process.env.ENGINE_API_KEY ||
  "";

export async function engineFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${ENGINE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers || {});
  if (ENGINE_API_KEY && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${ENGINE_API_KEY}`);
  }
  try {
    return await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new EngineError(
      `Cannot reach HushVoice engine at ${ENGINE_URL}. Start it with: docker compose up -d engine`,
      503
    );
  }
}

export async function getEngineHealth(): Promise<{
  ok: boolean;
  url: string;
  status?: number;
  body?: unknown;
  error?: string;
}> {
  try {
    const res = await engineFetch("/health");
    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      url: ENGINE_URL,
      status: res.status,
      body,
    };
  } catch (err) {
    return {
      ok: false,
      url: ENGINE_URL,
      error: err instanceof Error ? err.message : "Unreachable",
    };
  }
}

export async function listProfiles(): Promise<EngineProfile[]> {
  const res = await engineFetch("/profiles");
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineProfile[];
}

export async function getProfile(id: string): Promise<EngineProfile | null> {
  const res = await engineFetch(`/profiles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineProfile;
}

export async function createProfile(input: {
  name: string;
  language: string;
  description?: string;
  default_engine?: string;
}): Promise<EngineProfile> {
  const res = await engineFetch("/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      language: input.language,
      description: input.description ?? "HushVoice clone",
      voice_type: "cloned",
      default_engine: input.default_engine ?? DEFAULT_ENGINE,
    }),
  });
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineProfile;
}

export async function deleteProfile(id: string): Promise<void> {
  const res = await engineFetch(`/profiles/${id}`, { method: "DELETE" });
  if (res.status === 404) return;
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
}

export async function addProfileSample(input: {
  profileId: string;
  audio: Blob | Buffer | ArrayBuffer;
  filename: string;
  contentType: string;
  referenceText: string;
}): Promise<EngineSample> {
  const form = new FormData();
  const blob =
    input.audio instanceof Blob
      ? input.audio
      : new Blob([input.audio as BlobPart], { type: input.contentType });
  form.append("file", blob, input.filename);
  form.append("reference_text", input.referenceText);

  const res = await engineFetch(`/profiles/${input.profileId}/samples`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineSample;
}

export async function listProfileSamples(
  profileId: string
): Promise<EngineSample[]> {
  const res = await engineFetch(`/profiles/${profileId}/samples`);
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineSample[];
}

export async function startGeneration(input: {
  profileId: string;
  text: string;
  language: string;
  engine?: string;
}): Promise<EngineGeneration> {
  const res = await engineFetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: input.profileId,
      text: input.text,
      language: input.language,
      engine: input.engine ?? DEFAULT_ENGINE,
      normalize: true,
    }),
  });
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineGeneration;
}

export async function getGeneration(
  id: string
): Promise<EngineGeneration | null> {
  const res = await engineFetch(`/history/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  return (await res.json()) as EngineGeneration;
}

/** Poll until generation completes or fails. */
export async function waitForGeneration(
  id: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
): Promise<EngineGeneration> {
  const timeoutMs = opts?.timeoutMs ?? 10 * 60 * 1000;
  const intervalMs = opts?.intervalMs ?? 1000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const gen = await getGeneration(id);
    if (!gen) throw new EngineError("Generation not found", 404);
    if (gen.status === "completed") return gen;
    if (gen.status === "failed") {
      throw new EngineError(gen.error || "Speech generation failed", 500);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new EngineError("Speech generation timed out", 504);
}

export async function fetchGenerationAudio(
  generationId: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await engineFetch(`/audio/${generationId}`);
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  return { buffer: await res.arrayBuffer(), contentType };
}

export async function fetchSampleAudio(
  sampleId: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await engineFetch(`/samples/${sampleId}`);
  if (!res.ok) throw new EngineError(await parseError(res), res.status);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  return { buffer: await res.arrayBuffer(), contentType };
}

/** Normalize UI language codes to engine-supported codes. */
export function toEngineLanguage(code: string): string {
  const map: Record<string, string> = {
    en: "en",
    zh: "zh",
    ja: "ja",
    ko: "ko",
    de: "de",
    fr: "fr",
    ru: "ru",
    pt: "pt",
    es: "es",
    it: "it",
    he: "he",
    ar: "ar",
    da: "da",
    el: "el",
    fi: "fi",
    hi: "hi",
    ms: "ms",
    nl: "nl",
    no: "no",
    pl: "pl",
    sv: "sv",
    sw: "sw",
    tr: "tr",
    ta: "hi",
    bn: "hi",
  };
  return map[code] || "en";
}

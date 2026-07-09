/**
 * Client for a self-hosted Voicebox server (https://github.com/jamiepine/voicebox).
 * All cloning + TTS runs locally — no third-party API keys.
 */

export const VOICEBOX_URL = (
  process.env.VOICEBOX_URL || "http://127.0.0.1:17493"
).replace(/\/$/, "");

/** Default engine: Chatterbox Multilingual — zero-shot clone, 23 languages. */
export const DEFAULT_ENGINE = process.env.VOICEBOX_ENGINE || "chatterbox";

export type VoiceboxProfile = {
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

export type VoiceboxSample = {
  id: string;
  profile_id: string;
  audio_path: string;
  reference_text: string;
};

export type VoiceboxGeneration = {
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

export class VoiceboxError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "VoiceboxError";
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
  return res.statusText || `Voicebox error (${res.status})`;
}

export async function voiceboxFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${VOICEBOX_URL}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    return await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new VoiceboxError(
      `Cannot reach Voicebox at ${VOICEBOX_URL}. Start it with: docker compose up -d voicebox`,
      503
    );
  }
}

export async function getVoiceboxHealth(): Promise<{
  ok: boolean;
  url: string;
  status?: number;
  body?: unknown;
  error?: string;
}> {
  try {
    const res = await voiceboxFetch("/health");
    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      url: VOICEBOX_URL,
      status: res.status,
      body,
    };
  } catch (err) {
    return {
      ok: false,
      url: VOICEBOX_URL,
      error: err instanceof Error ? err.message : "Unreachable",
    };
  }
}

export async function listProfiles(): Promise<VoiceboxProfile[]> {
  const res = await voiceboxFetch("/profiles");
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxProfile[];
}

export async function getProfile(
  id: string
): Promise<VoiceboxProfile | null> {
  const res = await voiceboxFetch(`/profiles/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxProfile;
}

export async function createProfile(input: {
  name: string;
  language: string;
  description?: string;
  default_engine?: string;
}): Promise<VoiceboxProfile> {
  const res = await voiceboxFetch("/profiles", {
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
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxProfile;
}

export async function deleteProfile(id: string): Promise<void> {
  const res = await voiceboxFetch(`/profiles/${id}`, { method: "DELETE" });
  if (res.status === 404) return;
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
}

export async function addProfileSample(input: {
  profileId: string;
  audio: Blob | Buffer | ArrayBuffer;
  filename: string;
  contentType: string;
  referenceText: string;
}): Promise<VoiceboxSample> {
  const form = new FormData();
  const blob =
    input.audio instanceof Blob
      ? input.audio
      : new Blob([input.audio as BlobPart], { type: input.contentType });
  form.append("file", blob, input.filename);
  form.append("reference_text", input.referenceText);

  const res = await voiceboxFetch(`/profiles/${input.profileId}/samples`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxSample;
}

export async function listProfileSamples(
  profileId: string
): Promise<VoiceboxSample[]> {
  const res = await voiceboxFetch(`/profiles/${profileId}/samples`);
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxSample[];
}

export async function startGeneration(input: {
  profileId: string;
  text: string;
  language: string;
  engine?: string;
}): Promise<VoiceboxGeneration> {
  const res = await voiceboxFetch("/generate", {
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
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxGeneration;
}

export async function getGeneration(
  id: string
): Promise<VoiceboxGeneration | null> {
  const res = await voiceboxFetch(`/history/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  return (await res.json()) as VoiceboxGeneration;
}

/** Poll until generation completes or fails. */
export async function waitForGeneration(
  id: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
): Promise<VoiceboxGeneration> {
  const timeoutMs = opts?.timeoutMs ?? 10 * 60 * 1000;
  const intervalMs = opts?.intervalMs ?? 1000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const gen = await getGeneration(id);
    if (!gen) throw new VoiceboxError("Generation not found", 404);
    if (gen.status === "completed") return gen;
    if (gen.status === "failed") {
      throw new VoiceboxError(
        gen.error || "Voicebox generation failed",
        500
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new VoiceboxError("Voicebox generation timed out", 504);
}

export async function fetchGenerationAudio(
  generationId: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await voiceboxFetch(`/audio/${generationId}`);
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  return { buffer: await res.arrayBuffer(), contentType };
}

export async function fetchSampleAudio(
  sampleId: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await voiceboxFetch(`/samples/${sampleId}`);
  if (!res.ok) throw new VoiceboxError(await parseError(res), res.status);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  return { buffer: await res.arrayBuffer(), contentType };
}

/** Map HushVoice language codes to Voicebox-supported codes. */
export function toVoiceboxLanguage(code: string): string {
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
    // Closest fallbacks for codes we show in UI but Voicebox maps differently
    ta: "hi",
    bn: "hi",
  };
  return map[code] || "en";
}

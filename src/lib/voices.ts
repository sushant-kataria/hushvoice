import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type VoiceProfile = {
  id: string;
  name: string;
  language: string;
  prompt: string;
  createdAt: string;
  durationMs: number;
  sampleRate: number;
  /** Relative path under .data/voices */
  audioFile: string;
};

const DATA_DIR = path.join(process.cwd(), ".data", "voices");
const INDEX_FILE = path.join(DATA_DIR, "index.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readIndex(): Promise<VoiceProfile[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf8");
    return JSON.parse(raw) as VoiceProfile[];
  } catch {
    return [];
  }
}

async function writeIndex(voices: VoiceProfile[]) {
  await ensureDir();
  await fs.writeFile(INDEX_FILE, JSON.stringify(voices, null, 2), "utf8");
}

export async function listVoices(): Promise<VoiceProfile[]> {
  const voices = await readIndex();
  return voices.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getVoice(id: string): Promise<VoiceProfile | null> {
  const voices = await readIndex();
  return voices.find((v) => v.id === id) ?? null;
}

export async function saveVoice(input: {
  name: string;
  language: string;
  prompt: string;
  durationMs: number;
  sampleRate: number;
  audioBuffer: Buffer;
  ext?: string;
}): Promise<VoiceProfile> {
  await ensureDir();
  const id = randomUUID();
  const ext = input.ext ?? "webm";
  const audioFile = `${id}.${ext}`;
  const filePath = path.join(DATA_DIR, audioFile);
  await fs.writeFile(filePath, input.audioBuffer);

  const profile: VoiceProfile = {
    id,
    name: input.name.trim() || "My Voice",
    language: input.language,
    prompt: input.prompt,
    createdAt: new Date().toISOString(),
    durationMs: input.durationMs,
    sampleRate: input.sampleRate,
    audioFile,
  };

  const voices = await readIndex();
  voices.push(profile);
  await writeIndex(voices);
  return profile;
}

export async function deleteVoice(id: string): Promise<boolean> {
  const voices = await readIndex();
  const voice = voices.find((v) => v.id === id);
  if (!voice) return false;

  try {
    await fs.unlink(path.join(DATA_DIR, voice.audioFile));
  } catch {
    // ignore missing file
  }

  await writeIndex(voices.filter((v) => v.id !== id));
  return true;
}

export function voiceAudioPath(voice: VoiceProfile) {
  return path.join(DATA_DIR, voice.audioFile);
}

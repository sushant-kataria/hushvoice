/** Client-side helpers for recording and speaking with a cloned voice profile. */

export type VoicePrint = {
  /** Average fundamental frequency estimate in Hz */
  pitchHz: number;
  /** Relative energy 0–1 */
  energy: number;
  /** Speech rate proxy from zero-crossing density */
  brightness: number;
};

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export async function analyzeVoicePrint(blob: Blob): Promise<VoicePrint> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const channel = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;

    // Simple autocorrelation pitch estimate on a mid slice
    const start = Math.floor(channel.length * 0.2);
    const end = Math.min(channel.length, start + sampleRate);
    const slice = channel.subarray(start, end);

    let energy = 0;
    for (let i = 0; i < slice.length; i++) energy += slice[i] * slice[i];
    energy = Math.sqrt(energy / Math.max(1, slice.length));

    const minLag = Math.floor(sampleRate / 400);
    const maxLag = Math.floor(sampleRate / 70);
    let bestLag = minLag;
    let bestCorr = -Infinity;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      const n = slice.length - lag;
      for (let i = 0; i < n; i += 4) {
        corr += slice[i] * slice[i + lag];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    const pitchHz = sampleRate / bestLag;

    // High-frequency energy proxy
    let zc = 0;
    for (let i = 1; i < slice.length; i++) {
      if (slice[i - 1] * slice[i] < 0) zc++;
    }
    const brightness = Math.min(1, zc / (slice.length * 0.15));

    return {
      pitchHz: Number.isFinite(pitchHz) ? pitchHz : 160,
      energy: Number.isFinite(energy) ? energy : 0.1,
      brightness,
    };
  } finally {
    await ctx.close();
  }
}

/** Map voice print → SpeechSynthesisUtterance pitch/rate. */
export function utteranceParamsFromPrint(print: VoicePrint): {
  pitch: number;
  rate: number;
} {
  // SpeechSynthesis pitch is roughly 0–2, default 1
  // Map 90–280 Hz → ~0.7–1.4
  const pitch = Math.min(1.6, Math.max(0.6, (print.pitchHz - 90) / 190 + 0.7));
  const rate = Math.min(1.25, Math.max(0.75, 0.85 + print.brightness * 0.35));
  return { pitch, rate };
}

export function pickSpeechVoice(
  locale: string,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang.replace("_", "-") === locale);
  if (exact) return exact;
  const prefix = locale.split("-")[0];
  const byPrefix = voices.find((v) =>
    v.lang.toLowerCase().startsWith(prefix.toLowerCase())
  );
  if (byPrefix) return byPrefix;
  return voices.find((v) => v.default) ?? voices[0] ?? null;
}

export function speakWithBrowser(options: {
  text: string;
  locale: string;
  print?: VoicePrint | null;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}): SpeechSynthesisUtterance {
  const { text, locale, print, onEnd, onError } = options;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = locale;

  const voices = window.speechSynthesis.getVoices();
  const voice = pickSpeechVoice(locale, voices);
  if (voice) utter.voice = voice;

  if (print) {
    const params = utteranceParamsFromPrint(print);
    utter.pitch = params.pitch;
    utter.rate = params.rate;
  }

  utter.onend = () => onEnd?.();
  utter.onerror = (e) =>
    onError?.(new Error(e.error || "Speech synthesis failed"));

  window.speechSynthesis.speak(utter);
  return utter;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

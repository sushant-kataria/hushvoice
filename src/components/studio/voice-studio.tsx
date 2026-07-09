"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Loader2,
  Mic,
  MicOff,
  Play,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import { formatDuration } from "@/lib/audio";
import { Waveform } from "@/components/studio/waveform";
import { BackendStatus } from "@/components/studio/backend-status";
import { cn } from "@/lib/utils";

type VoiceProfile = {
  id: string;
  name: string;
  language: string;
  prompt: string;
  createdAt: string;
  durationMs: number;
};

type Step = "record" | "clone" | "speak";

const MIN_MS = 3000;
const TARGET_MS = 12000;

export function VoiceStudio() {
  const [step, setStep] = useState<Step>("record");
  const [language, setLanguage] = useState("en");
  const [voiceName, setVoiceName] = useState("My Voice");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [voices, setVoices] = useState<VoiceProfile[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [speakLang, setSpeakLang] = useState("en");
  const [text, setText] = useState(
    "Hello — this is my cloned voice speaking through HushVoice."
  );
  const [speaking, setSpeaking] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const lang = useMemo(() => getLanguage(language), [language]);
  const activeVoice = voices.find((v) => v.id === activeVoiceId) ?? null;

  const refreshVoices = useCallback(async (selectFirst = false) => {
    try {
      const res = await fetch("/api/voices");
      const data = (await res.json()) as { voices: VoiceProfile[] };
      const list = data.voices || [];
      setVoices(list);
      if (selectFirst && list[0]) {
        setActiveVoiceId((current) => current ?? list[0].id);
      }
    } catch {
      toast.error("Could not load saved voices");
    } finally {
      setLoadingVoices(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/voices");
        const data = (await res.json()) as { voices: VoiceProfile[] };
        if (cancelled) return;
        const list = data.voices || [];
        setVoices(list);
        if (list[0]) {
          setActiveVoiceId((current) => current ?? list[0].id);
        }
      } catch {
        if (!cancelled) toast.error("Could not load saved voices");
      } finally {
        if (!cancelled) setLoadingVoices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Warm speech synthesis voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handler = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      return () =>
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(200);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 100);
    } catch {
      toast.error("Microphone access is required to clone your voice.");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsed(Date.now() - startedAtRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function resetRecording() {
    setAudioBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setCloneProgress(0);
  }

  async function createClone() {
    if (!audioBlob) {
      toast.error("Record the prompt sentence first.");
      return;
    }
    if (elapsed < MIN_MS) {
      toast.error("Please record at least 3 seconds of clear speech.");
      return;
    }

    setCloning(true);
    setStep("clone");
    setCloneProgress(12);

    const tick = window.setInterval(() => {
      setCloneProgress((p) => Math.min(88, p + 6 + Math.random() * 8));
    }, 280);

    try {
      const form = new FormData();
      form.append("audio", audioBlob, "sample.webm");
      form.append("language", language);
      form.append("name", voiceName);
      form.append("durationMs", String(elapsed));
      form.append("prompt", lang.prompt);
      form.append("sampleRate", "48000");

      const res = await fetch("/api/clone", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clone failed");

      setCloneProgress(100);
      toast.success("Voice clone ready");
      setActiveVoiceId(data.voice.id);
      setSpeakLang(data.voice.language || language);
      await refreshVoices(true);
      setStep("speak");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clone failed");
      setStep("record");
    } finally {
      window.clearInterval(tick);
      setCloning(false);
    }
  }

  async function handleSpeak() {
    if (!activeVoiceId) {
      toast.error("Create or select a voice clone first.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Type something to speak.");
      return;
    }

    setSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: activeVoiceId,
          text: trimmed,
          language: speakLang,
        }),
      });

      const startData = (await res.json().catch(() => ({}))) as {
        error?: string;
        generationId?: string;
      };
      if (!res.ok) {
        throw new Error(
          startData.error || "Speak failed — is Voicebox running?"
        );
      }
      if (!startData.generationId) {
        throw new Error("Voicebox did not start a generation. Check /api/health.");
      }

      // Poll until complete (Vercel-safe — short requests)
      const deadline = Date.now() + 10 * 60 * 1000;
      let audioUrl: string | null = null;
      let contentType = "audio/wav";

      while (Date.now() < deadline) {
        const statusRes = await fetch(`/api/speak/${startData.generationId}`);
        const status = (await statusRes.json()) as {
          status?: string;
          error?: string | null;
        };
        if (!statusRes.ok) {
          throw new Error(status.error || "Failed to check generation status");
        }
        if (status.status === "failed") {
          throw new Error(status.error || "Voicebox generation failed");
        }
        if (status.status === "completed") {
          const audioRes = await fetch(
            `/api/speak/${startData.generationId}?audio=1`
          );
          if (!audioRes.ok) {
            const err = await audioRes.json().catch(() => ({}));
            throw new Error(
              (err as { error?: string }).error || "Failed to fetch audio"
            );
          }
          contentType = audioRes.headers.get("Content-Type") || contentType;
          const buf = await audioRes.arrayBuffer();
          audioUrl = URL.createObjectURL(new Blob([buf], { type: contentType }));
          break;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (!audioUrl) {
        throw new Error("Generation timed out. Try a shorter sentence.");
      }

      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl!);
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(audioUrl!);
        toast.error("Playback failed");
      };
      await audio.play();
    } catch (err) {
      setSpeaking(false);
      toast.error(err instanceof Error ? err.message : "Speak failed");
    }
  }

  async function removeVoice(id: string) {
    try {
      const res = await fetch(`/api/voices?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (activeVoiceId === id) setActiveVoiceId(null);
      await refreshVoices(false);
      toast.success("Voice removed");
    } catch {
      toast.error("Could not delete voice");
    }
  }

  const progressPct = Math.min(100, (elapsed / TARGET_MS) * 100);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" })
              )}
              aria-label="Back home"
            >
              <ArrowLeft />
            </Link>
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full hv-spectrum">
                <span className="size-2.5 rounded-full bg-white/90" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg">
                HushVoice Studio
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StepPill active={step === "record"} done={!!audioBlob || !!activeVoice}>
              1 · Record
            </StepPill>
            <StepPill active={step === "clone"} done={step === "speak"}>
              2 · Clone
            </StepPill>
            <StepPill active={step === "speak"}>3 · Speak</StepPill>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <BackendStatus />
      </div>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          {/* RECORD */}
          <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-30 blur-3xl hv-spectrum"
            />
            <div className="relative">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ocean">Step 1</p>
                  <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
                    Record the sentence
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Read the prompt aloud in a quiet place. Aim for 8–12 seconds
                    of clear speech.
                  </p>
                </div>
                <div className="w-full max-w-[200px] space-y-1.5">
                  <Label htmlFor="lang">Language</Label>
                  <Select
                    value={language}
                    onValueChange={(v) => {
                      if (typeof v === "string") setLanguage(v);
                    }}
                  >
                    <SelectTrigger id="lang" className="w-full">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name} · {l.nativeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <blockquote className="mt-6 rounded-2xl border border-dashed border-ocean/30 bg-secondary/50 px-5 py-5 font-[family-name:var(--font-display)] text-lg leading-relaxed text-foreground sm:text-xl">
                “{lang.prompt}”
              </blockquote>

              <div className="mt-6 flex flex-col items-center gap-4">
                <Waveform active={recording} />
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {formatDuration(elapsed)}
                  </span>
                  <span>·</span>
                  <span>target {formatDuration(TARGET_MS)}</span>
                </div>
                <Progress value={progressPct} className="h-1.5 w-full max-w-sm" />

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  {!recording ? (
                    <Button
                      size="lg"
                      className="h-11 hv-spectrum border-0 px-5 text-white"
                      onClick={() => void startRecording()}
                      disabled={cloning}
                    >
                      <Mic data-icon="inline-start" />
                      {audioBlob ? "Re-record" : "Start recording"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="destructive"
                      className="h-11 px-5"
                      onClick={stopRecording}
                    >
                      <span className="relative mr-1 flex size-3">
                        <span className="absolute inset-0 rounded-full bg-current hv-pulse-ring" />
                        <span className="relative size-3 rounded-full bg-current" />
                      </span>
                      <Square data-icon="inline-start" className="size-3.5" />
                      Stop
                    </Button>
                  )}

                  {previewUrl && !recording && (
                    <>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11"
                        onClick={() => {
                          const a = new Audio(previewUrl);
                          void a.play();
                        }}
                      >
                        <Play data-icon="inline-start" />
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="h-11"
                        onClick={resetRecording}
                      >
                        <MicOff data-icon="inline-start" />
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator className="my-8" />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full max-w-xs space-y-1.5">
                  <Label htmlFor="voice-name">Voice name</Label>
                  <Input
                    id="voice-name"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="My Voice"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-11 px-6"
                  disabled={!audioBlob || recording || cloning || elapsed < MIN_MS}
                  onClick={() => void createClone()}
                >
                  {cloning ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Check data-icon="inline-start" />
                  )}
                  Generate voice clone
                </Button>
              </div>
            </div>
          </section>

          {/* CLONE progress */}
          {(cloning || step === "clone") && (
            <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
              <p className="text-sm font-medium text-saffron">Step 2</p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                Building your voice clone
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Uploading your sample to Voicebox and creating a local clone profile…
              </p>
              <Progress value={cloneProgress} className="mt-6 h-2" />
            </section>
          )}

          {/* SPEAK */}
          <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ocean">Step 3</p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight sm:text-3xl">
                  Type anything
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Voicebox synthesizes speech in your cloned voice. Switch
                  languages anytime — models run on your server.
                </p>
              </div>
              <div className="w-full max-w-[200px] space-y-1.5">
                <Label>Speak in</Label>
                <Select
                  value={speakLang}
                  onValueChange={(v) => {
                    if (typeof v === "string") setSpeakLang(v);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Label htmlFor="speak-text">Text to speak</Label>
              <Textarea
                id="speak-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Type what you want to hear in your voice…"
                className="min-h-32 resize-y text-base"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {text.trim().length}/2000 ·{" "}
                  {activeVoice
                    ? `Using “${activeVoice.name}”`
                    : "No voice selected yet"}
                </p>
                <Button
                  size="lg"
                  className="h-11 hv-spectrum border-0 px-5 text-white"
                  disabled={!activeVoiceId || speaking || !text.trim()}
                  onClick={() => void handleSpeak()}
                >
                  {speaking ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Volume2 data-icon="inline-start" />
                  )}
                  {speaking ? "Speaking…" : "Speak in my voice"}
                </Button>
              </div>
              {speaking && (
                <div className="pt-2">
                  <Waveform active bars={32} />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar voices */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-border/80 bg-card p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg">
              Your voices
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Saved clones on this device
            </p>
            <ul className="mt-4 space-y-2">
              {loadingVoices && (
                <li className="text-sm text-muted-foreground">Loading…</li>
              )}
              {!loadingVoices && voices.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  No clones yet. Record a sentence to begin.
                </li>
              )}
              {voices.map((v) => {
                const selected = v.id === activeVoiceId;
                const meta = getLanguage(v.language);
                return (
                  <li key={v.id}>
                    <div
                      className={cn(
                        "flex items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors",
                        selected
                          ? "border-ocean/50 bg-secondary"
                          : "border-border/80 hover:bg-muted/50"
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          setActiveVoiceId(v.id);
                          setSpeakLang(v.language);
                          setStep("speak");
                        }}
                      >
                        <span className="block truncate text-sm font-medium">
                          {v.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="px-1.5 py-0">
                            {meta.flag}
                          </Badge>
                          {formatDuration(v.durationMs)}
                        </span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Delete ${v.name}`}
                        onClick={() => void removeVoice(v.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Self-hosted</p>
            <p className="mt-1.5 leading-relaxed">
              Cloning and speech run on your{" "}
              <a
                href="https://github.com/jamiepine/voicebox"
                target="_blank"
                rel="noreferrer"
                className="text-ocean underline-offset-2 hover:underline"
              >
                Voicebox
              </a>{" "}
              server — Chatterbox Multilingual, no API keys. Start it with{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                docker compose up -d voicebox
              </code>
              .
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StepPill({
  children,
  active,
  done,
}: {
  children: React.ReactNode;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <span
      className={cn(
        "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
        active && "bg-secondary text-secondary-foreground",
        done && !active && "text-ocean",
        !active && !done && "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

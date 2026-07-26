import type { Metadata } from "next";
import { VoiceStudio } from "@/components/studio/voice-studio";

export const metadata: Metadata = {
  title: "Studio — HushVoice",
  description:
    "Record a sentence, clone your voice, and speak any text in your voice across multiple languages.",
};

export default function StudioPage() {
  return <VoiceStudio />;
}

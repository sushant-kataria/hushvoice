"use client";

import { motion } from "framer-motion";
import { Mic, Sparkles, Type } from "lucide-react";

const steps = [
  {
    icon: Mic,
    title: "Record the sentence",
    body: "We show a short prompt in your language. Read it aloud — a few clear seconds is enough.",
  },
  {
    icon: Sparkles,
    title: "Clone your voice",
    body: "HushVoice creates a local voice profile from your sample — zero-shot cloning on your machine.",
  },
  {
    icon: Type,
    title: "Type anything",
    body: "Write in English, Hindi, Spanish, or more. HushVoice synthesizes the reply in your cloned voice.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-medium tracking-wide text-ocean">
            Three steps
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight text-foreground sm:text-4xl md:text-5xl">
            From your voice to any words
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            A simple gateway between speaking and creating — record once, speak
            forever.
          </p>
        </motion.div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="relative"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full hv-spectrum text-white shadow-sm">
                  <step.icon className="size-5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.body}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

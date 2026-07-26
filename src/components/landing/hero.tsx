"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden hv-grain">
      {/* Full-bleed atmospheric plane */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, rgb(232 93 42 / 28%), transparent 55%), radial-gradient(ellipse 70% 50% at 15% 80%, rgb(47 111 237 / 32%), transparent 50%), linear-gradient(165deg, #0c1220 0%, #152038 42%, #2a1a14 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 hv-jali opacity-40" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
      />

      {/* Soft moving spectrum orb */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-16 size-[28rem] rounded-full opacity-50 blur-3xl hv-spectrum sm:size-[36rem]"
        animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-5 pb-24 pt-28 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 font-[family-name:var(--font-display)] text-5xl tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
        >
          HushVoice
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="max-w-3xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-white/90 sm:text-3xl md:text-4xl"
        >
          Clone your voice. Speak any language.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
        >
          Record one sentence on screen. We build your voice clone on your own
          HushVoice engine. Then type anything — and hear it spoken back in your
          voice, across twenty-three languages. No API keys.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/studio"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 px-5 hv-spectrum border-0 text-white shadow-lg shadow-orange-900/20 hover:opacity-95"
            )}
          >
            Start cloning
          </Link>
          <a
            href="#how"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 border-white/25 bg-white/5 px-5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
            )}
          >
            See how it works
          </a>
        </motion.div>

        {/* Waveform motif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-16 flex h-12 items-end gap-1 sm:mt-20"
          aria-hidden
        >
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="hv-wave-bar w-1 rounded-full bg-gradient-to-t from-ocean to-saffron sm:w-1.5"
              style={{
                height: `${18 + ((i * 37) % 40)}px`,
                animationDelay: `${(i % 8) * 0.1}s`,
                opacity: 0.35 + (i % 5) * 0.1,
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

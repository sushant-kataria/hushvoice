"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Cta() {
  return (
    <section id="studio" className="relative scroll-mt-20 pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          <div aria-hidden className="absolute inset-0 hv-spectrum" />
          <div aria-hidden className="absolute inset-0 hv-jali opacity-30" />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/35"
          />

          <div className="relative z-10">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
              Your voice is the gateway
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/80 sm:text-lg">
              Open the studio, record the prompt, and start speaking in a voice
              that is unmistakably yours.
            </p>
            <Link
              href="/studio"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 h-11 border-0 bg-white px-6 text-ink hover:bg-white/90"
              )}
            >
              Enter the studio
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

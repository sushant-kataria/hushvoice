"use client";

import { motion } from "framer-motion";
import { LANGUAGES } from "@/lib/languages";

export function Languages() {
  return (
    <section
      id="languages"
      className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgb(47 111 237 / 10%), transparent), radial-gradient(ellipse 50% 40% at 80% 80%, rgb(232 93 42 / 10%), transparent)",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="text-sm font-medium tracking-wide text-saffron">
            Multilingual by design
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl md:text-5xl">
            One voice. Twelve languages.
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Clone in the language you speak. Generate speech in the language you
            need — from Hindi and Tamil to Japanese and Arabic.
          </p>
        </motion.div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {LANGUAGES.map((lang, i) => (
            <motion.li
              key={lang.code}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-3.5 backdrop-blur transition-colors hover:border-ocean/40"
            >
              <span className="grid size-9 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {lang.flag}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {lang.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {lang.nativeName}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

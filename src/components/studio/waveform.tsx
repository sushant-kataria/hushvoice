"use client";

import { cn } from "@/lib/utils";

export function Waveform({
  active,
  bars = 24,
  className,
}: {
  active?: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex h-10 items-end justify-center gap-1", className)}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-gradient-to-t from-ocean to-saffron sm:w-1.5",
            active ? "hv-wave-bar" : "opacity-40"
          )}
          style={{
            height: active
              ? `${14 + ((i * 41) % 26)}px`
              : `${8 + ((i * 17) % 12)}px`,
            animationDelay: active ? `${(i % 7) * 0.08}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

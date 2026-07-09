"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/75 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid size-8 place-items-center overflow-hidden rounded-full hv-spectrum shadow-sm">
            <span className="size-3 rounded-full bg-white/90" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-foreground">
            HushVoice
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a
            href="#languages"
            className="transition-colors hover:text-foreground"
          >
            Languages
          </a>
          <a href="#studio" className="transition-colors hover:text-foreground">
            Studio
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#how"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Learn more
          </a>
          <Link
            href="/studio"
            className={cn(
              buttonVariants({ size: "sm" }),
              "hv-spectrum border-0 text-white shadow-sm hover:opacity-90"
            )}
          >
            Open studio
          </Link>
        </div>
      </div>
    </header>
  );
}

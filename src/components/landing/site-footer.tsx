import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full hv-spectrum">
            <span className="size-2.5 rounded-full bg-white/90" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg">
            HushVoice
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Voice cloning for everyone. Inspired by the craft of multilingual AI.
        </p>
        <Link
          href="/studio"
          className="text-sm font-medium text-ocean hover:underline"
        >
          Open studio →
        </Link>
      </div>
    </footer>
  );
}

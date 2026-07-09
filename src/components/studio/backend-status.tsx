"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Health = {
  hushvoice?: string;
  engine?: string;
  apiKeysRequired?: boolean;
  engineHealth?: {
    ok?: boolean;
    url?: string;
    error?: string;
  };
};

export function BackendStatus({ className }: { className?: string }) {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/health");
        const data = (await res.json()) as Health;
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled)
          setHealth({ engineHealth: { ok: false, error: "unreachable" } });
      }
    };
    void load();
    const id = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const ok = Boolean(health?.engineHealth?.ok);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
        className
      )}
    >
      <Badge
        variant={ok ? "secondary" : "destructive"}
        className="gap-1.5 px-2"
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            ok ? "bg-emerald-500" : "bg-destructive"
          )}
        />
        {ok ? "Engine online" : "Engine offline"}
      </Badge>
      <span className="truncate">
        {ok
          ? `Self-hosted · ${health?.engine || "chatterbox"} · no API keys`
          : health?.engineHealth?.error ||
            "Start with docker compose up -d engine"}
      </span>
    </div>
  );
}

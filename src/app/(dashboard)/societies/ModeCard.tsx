import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocietyCrest } from "./SocietyCrest";
import type { SocietyModeRow } from "./types";

/** One society mode as a glass-panel card linking to its editor. */
export function ModeCard({ mode }: { mode: SocietyModeRow }) {
  return (
    <Link
      href={`/societies/${mode.id}`}
      className="group flex items-start gap-3 rounded-xl glass-panel p-4 transition-colors hover:border-brand/40"
    >
      <SocietyCrest glyph={mode.glyph} color={mode.color} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-ink">{mode.name}</p>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              mode.enabled
                ? "border-brand/40 bg-brand/15 text-brand"
                : "border-border bg-paper-sunken/70 text-ink-3",
            )}
          >
            {mode.enabled ? "On" : "Off"}
          </span>
        </div>
        {mode.tagline && <p className="mt-0.5 line-clamp-2 text-xs text-ink-3">{mode.tagline}</p>}
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">{mode.key}</p>
      </div>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

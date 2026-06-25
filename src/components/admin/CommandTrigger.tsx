"use client";

import { Search } from "lucide-react";
import { OPEN_COMMAND_EVENT } from "@/components/admin/CommandPalette";

/** The TopBar search affordance. Opens the ⌘K palette; shows the shortcut
 *  hint. Decoupled from the palette host via a window event. The palette
 *  itself binds both ⌘K and Ctrl-K, so the hint is cosmetic. */
export function CommandTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
      className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-paper-sunken/60 py-1.5 pl-2.5 pr-1.5 text-ink-3 transition-colors hover:border-rule-strong hover:text-ink-2"
      aria-label="Open command palette (Command-K)"
    >
      <Search aria-hidden className="size-4" />
      <span className="hidden text-xs sm:inline">Search</span>
      <kbd className="kbd ml-1 hidden sm:inline-flex">⌘K</kbd>
    </button>
  );
}

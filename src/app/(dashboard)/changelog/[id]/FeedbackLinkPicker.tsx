"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type FeedbackSearchRow, searchFeedback } from "../actions";

/**
 * Inline search-and-pick for tagging a change line to a feedback report. Reuses
 * the `searchFeedback` action (→ admin_feedback_queue). Debounced; selecting a
 * row hands the trimmed report up to the parent, which persists the link.
 */
export function FeedbackLinkPicker({
  onPick,
  onCancel,
}: {
  onPick: (report: FeedbackSearchRow) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedbackSearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending debounce on unmount.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Debounce in the change handler (not an effect) so we never setState
  // synchronously inside an effect body.
  function handleChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const mine = ++reqId.current;
    timer.current = setTimeout(async () => {
      const res = await searchFeedback(q);
      if (mine !== reqId.current) return; // a newer keystroke superseded this
      setLoading(false);
      setResults(res.ok ? (res.data ?? []) : []);
    }, 250);
  }

  return (
    <div className="space-y-2 rounded-lg border border-brand/30 bg-paper-sunken/40 p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
          />
          <Input
            autoFocus
            placeholder="Search feedback by text or @username…"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel();
            }}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-ink-3 transition-colors hover:text-ink-2"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>

      {query.trim().length >= 2 && (
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {loading && <p className="px-1 py-2 text-xs text-ink-3">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="px-1 py-2 text-xs text-ink-3">No matching reports.</p>
          )}
          {results.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onPick(report)}
              className="flex w-full items-start gap-2 rounded-md border border-rule/50 bg-paper-raised/40 p-2 text-left text-xs transition-colors hover:border-brand/40 hover:bg-paper-raised/70"
            >
              <span className="shrink-0 rounded-full border border-rule/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-3">
                {report.kind}
              </span>
              <span className="line-clamp-2 flex-1 text-ink-2">{report.body_preview}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

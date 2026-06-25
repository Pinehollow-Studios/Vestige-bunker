import Link from "next/link";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type AppVersionChange,
  type ChangeKind,
  type LinkedFeedback,
  CHANGE_KINDS,
  CHANGE_KIND_LABELS,
  parseChangeSummary,
} from "./types";

const KIND_HEADING: Record<ChangeKind, string> = {
  added: "text-brand",
  changed: "text-ink-2",
  improved: "text-brand",
  fixed: "text-amber",
  removed: "text-alert",
};

const KIND_DOT: Record<ChangeKind, string> = {
  added: "bg-brand/60",
  changed: "bg-ink-3/60",
  improved: "bg-brand/60",
  fixed: "bg-amber",
  removed: "bg-alert",
};

/**
 * Read-only rendering of a version's change lines, grouped by kind (Added /
 * Changed / Improved / Fixed / Removed). Shared by the full changelog read page
 * and the per-version View mode. A line tagged to a feedback report shows a
 * "report" chip linking to its thread (hydrated body in the tooltip when given).
 */
export function ChangeLinesView({
  changes,
  linkedFeedback,
  emptyLabel = "No changes recorded yet.",
}: {
  changes: AppVersionChange[];
  linkedFeedback?: Record<string, LinkedFeedback>;
  emptyLabel?: string;
}) {
  if (changes.length === 0) {
    return <p className="text-sm text-ink-3">{emptyLabel}</p>;
  }

  const groups = CHANGE_KINDS.map((kind) => ({
    kind,
    lines: changes.filter((c) => c.kind === kind),
  })).filter((g) => g.lines.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.kind} className="space-y-1.5">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.16em]",
              KIND_HEADING[group.kind],
            )}
          >
            {CHANGE_KIND_LABELS[group.kind]}
          </p>
          <ul className="space-y-1.5">
            {group.lines.map((line) => {
              const report = line.feedback_report_id
                ? linkedFeedback?.[line.feedback_report_id]
                : null;
              const { heading, items } = parseChangeSummary(line.summary);
              return (
                <li
                  key={line.id}
                  className="space-y-1.5 text-sm leading-snug text-ink"
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-[7px] inline-block size-1 shrink-0 rounded-full",
                        KIND_DOT[group.kind],
                      )}
                    />
                    <span className={cn("min-w-0 flex-1", items.length > 0 && "font-medium")}>
                      {heading}
                      {line.feedback_report_id && (
                        <Link
                          href={`/feedback/${line.feedback_report_id}`}
                          title={report?.body ?? undefined}
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-brand/30 px-1.5 py-0.5 align-middle text-[10px] font-medium text-brand transition-colors hover:bg-brand/10"
                        >
                          <Tag aria-hidden className="size-2.5" />
                          {report?.kind ?? "report"}
                        </Link>
                      )}
                    </span>
                  </div>
                  {items.length > 0 && (
                    <ul className="ml-4 space-y-1 border-l border-rule/50 pl-3.5">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-ink-2">
                          <span
                            aria-hidden
                            className={cn(
                              "mt-[7px] inline-block size-1 shrink-0 rounded-full",
                              KIND_DOT[group.kind],
                              "opacity-60",
                            )}
                          />
                          <span className="min-w-0 flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

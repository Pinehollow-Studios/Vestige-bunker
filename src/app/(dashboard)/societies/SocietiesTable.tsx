"use client";

import { Users } from "lucide-react";
import { Column, DataTable, type SortDir } from "@/components/admin/table/DataTable";
import { cn } from "@/lib/utils";
import { SocietyCrest } from "./SocietyCrest";
import type { SocietyRow } from "./types";

export function SocietiesTable({
  rows,
  sort,
  dir,
}: {
  rows: SocietyRow[];
  sort: string;
  dir: SortDir;
}) {
  const columns: Column<SocietyRow>[] = [
    {
      key: "name",
      header: "Society",
      sortKey: "name",
      width: "minmax(220px,2.6fr)",
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <SocietyCrest glyph={r.crest?.glyph} color={r.crest?.color} size={32} />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{r.name}</p>
            <p className="truncate text-xs text-ink-3">
              {r.is_editorial ? "Editorial" : "Member-created"}
              {r.county_name ? ` · ${r.county_name}` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "kind",
      header: "Type",
      sortKey: "kind",
      width: "110px",
      hideBelow: "md",
      cell: (r) => (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            r.is_editorial
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-ink-3/30 bg-ink-3/10 text-ink-3",
          )}
        >
          {r.is_editorial ? "Editorial" : "Member"}
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      sortKey: "members",
      width: "92px",
      align: "right",
      cell: (r) => (
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-ink-2">
          <Users aria-hidden className="size-3 text-ink-3" />
          {r.member_count}
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      sortKey: "created",
      width: "minmax(110px,1fr)",
      align: "right",
      hideBelow: "lg",
      cell: (r) => <span className="text-xs text-ink-3">{relativeTime(r.created_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.society_id}
      rowHref={(r) => `/societies/${r.society_id}`}
      sort={sort}
      dir={dir}
      empty={<p className="text-sm text-ink-3">No societies yet.</p>}
    />
  );
}

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

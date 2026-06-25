"use client";

import { Hash } from "lucide-react";
import { Column, DataTable, type SortDir } from "@/components/admin/table/DataTable";
import { listCoverURL } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  STATUS_CHIP,
  STATUS_DOT,
  STATUS_LABELS,
  statusFor,
  type CuratedListRow,
} from "./types";

export function CuratedTable({
  rows,
  sort,
  dir,
}: {
  rows: CuratedListRow[];
  sort: string;
  dir: SortDir;
}) {
  const columns: Column<CuratedListRow>[] = [
    {
      key: "name",
      header: "List",
      sortKey: "name",
      width: "minmax(220px,2.6fr)",
      cell: (r) => {
        const status = statusFor(r);
        const cover = listCoverURL(r.cover_storage_key);
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="size-8 shrink-0 rounded-md bg-paper-sunken object-cover" />
            ) : (
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-paper-sunken text-[8px] uppercase text-ink-3">
                —
              </span>
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium text-ink">
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])} />
                {r.name}
              </p>
              {r.description && <p className="truncate text-xs text-ink-3">{r.description}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      width: "110px",
      cell: (r) => {
        const status = statusFor(r);
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              STATUS_CHIP[status],
            )}
          >
            {STATUS_LABELS[status]}
          </span>
        );
      },
    },
    {
      key: "tier",
      header: "Tier",
      sortKey: "tier",
      width: "100px",
      hideBelow: "md",
      cell: (r) => <span className="text-xs capitalize text-ink-2">{r.tier ?? "—"}</span>,
    },
    {
      key: "courses",
      header: "Courses",
      sortKey: "courses",
      width: "92px",
      align: "right",
      cell: (r) => (
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-ink-2">
          <Hash aria-hidden className="size-3 text-ink-3" />
          {r.course_count}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      sortKey: "updated",
      width: "minmax(110px,1fr)",
      align: "right",
      hideBelow: "lg",
      cell: (r) => <span className="text-xs text-ink-3">{relativeTime(r.updated_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      rowHref={(r) => `/curated/${r.id}`}
      sort={sort}
      dir={dir}
      empty={<p className="text-sm text-ink-3">No curated lists match.</p>}
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

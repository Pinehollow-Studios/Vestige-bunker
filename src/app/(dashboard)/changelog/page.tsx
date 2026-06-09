import Link from "next/link";
import { ArrowUpRight, Rocket, Tag } from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { cn } from "@/lib/utils";
import { NewVersionButton } from "./NewVersionButton";
import {
  type AppVersion,
  type AppVersionWithCounts,
  compareVersionsDesc,
  currentVersion,
  VERSION_STATUS_LABELS,
} from "./types";

export const dynamic = "force-dynamic";

/**
 * Version changelog index. Admin RLS sees every version (draft + released).
 * Each card links to `/changelog/[id]` for the change-line editor + feedback
 * tagging. A prominent banner derives the current shipped version (highest
 * released).
 *
 * Forward-compat: the tables don't exist on prod until the
 * 20260609100000_app_version_changelog.sql migration is pushed, so a
 * missing-relation error renders the unconfigured state rather than throwing.
 */
export default async function ChangelogPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [versionsRes, changesRes] = await Promise.all([
    supabase
      .from("app_versions")
      .select("*")
      .order("major", { ascending: false })
      .order("minor", { ascending: false })
      .order("patch", { ascending: false }),
    supabase.from("app_version_changes").select("version_id, feedback_report_id"),
  ]);

  const notConfigured =
    !!versionsRes.error && isMissingRelation(versionsRes.error.message);

  const versions = (versionsRes.data as AppVersion[] | null) ?? [];
  const changeRows =
    (changesRes.data as Array<{
      version_id: string;
      feedback_report_id: string | null;
    }> | null) ?? [];

  // Aggregate change + linked-report counts per version in JS (the set is small).
  const counts = new Map<string, { change: number; linked: number }>();
  for (const row of changeRows) {
    const entry = counts.get(row.version_id) ?? { change: 0, linked: 0 };
    entry.change += 1;
    if (row.feedback_report_id) entry.linked += 1;
    counts.set(row.version_id, entry);
  }

  const rows: AppVersionWithCounts[] = versions
    .slice()
    .sort(compareVersionsDesc)
    .map((v) => ({
      ...v,
      change_count: counts.get(v.id)?.change ?? 0,
      linked_count: counts.get(v.id)?.linked ?? 0,
    }));

  const current = currentVersion(versions);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeader
        eyebrow="Editorial"
        title="Changelog"
        description="What shipped in each version of the app — and which reported bugs each release tackled."
        actions={<NewVersionButton />}
      />

      {versionsRes.error && !notConfigured && (
        <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load versions: {versionsRes.error.message}
        </div>
      )}

      {notConfigured && <NotConfigured />}

      {!notConfigured && current && <CurrentVersionBanner version={current} />}

      {!versionsRes.error && rows.length === 0 && <EmptyState />}

      {!notConfigured && rows.length > 0 && (
        <ol className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <VersionRowCard row={row} isCurrent={current?.id === row.id} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CurrentVersionBanner({ version }: { version: AppVersion }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
        <Rocket className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          Current version
        </p>
        <p className="font-hero text-2xl leading-tight text-ink">
          {version.version}
          {version.title && (
            <span className="ml-2 align-middle text-sm font-normal text-ink-2">
              {version.title}
            </span>
          )}
        </p>
      </div>
      {version.released_at && (
        <span className="shrink-0 text-xs text-ink-3">
          shipped {formatDate(version.released_at)}
        </span>
      )}
    </div>
  );
}

function VersionRowCard({
  row,
  isCurrent,
}: {
  row: AppVersionWithCounts;
  isCurrent: boolean;
}) {
  const released = row.status === "released";
  return (
    <Link
      href={`/changelog/${row.id}`}
      className="group/card block rounded-xl glass-panel p-5 transition-colors hover:border-brand/40"
    >
      <article className="flex flex-col gap-3">
        <header className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading text-lg font-semibold leading-snug text-ink">
                v{row.version}
              </span>
              {isCurrent && (
                <span className="inline-flex items-center rounded-full border border-brand/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  Current
                </span>
              )}
            </div>
            {row.title && <p className="text-sm text-ink-2">{row.title}</p>}
            {row.summary && (
              <p className="line-clamp-1 text-xs text-ink-3">{row.summary}</p>
            )}
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              released
                ? "border-brand/35 text-brand"
                : "border-rule/70 text-ink-3",
            )}
          >
            {VERSION_STATUS_LABELS[row.status]}
          </span>
        </header>

        <footer className="flex flex-wrap items-center gap-4 text-xs text-ink-3">
          <Stat label={row.change_count === 1 ? "change" : "changes"} value={row.change_count} />
          {row.linked_count > 0 && (
            <span className="inline-flex items-center gap-1 text-ink-2">
              <Tag aria-hidden className="size-3 text-brand" />
              <span className="font-semibold tabular-nums text-ink">{row.linked_count}</span>
              linked {row.linked_count === 1 ? "report" : "reports"}
            </span>
          )}
          {row.released_at && (
            <span className="text-ink-3">shipped {formatDate(row.released_at)}</span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-brand opacity-0 transition-opacity group-hover/card:opacity-100">
            Edit <ArrowUpRight aria-hidden className="size-3" />
          </span>
        </footer>
      </article>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-semibold tabular-nums text-ink">{value}</span>
      <span className="text-ink-3">{label}</span>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl glass-panel p-12 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Rocket className="size-5" />
        </span>
        <p className="font-display text-base font-semibold text-ink">No versions yet</p>
        <p className="text-sm text-ink-2">
          Add your first version to start tracking what ships in each release.
        </p>
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl glass-panel p-12 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-paper-sunken text-ink-3">
          <Rocket className="size-5" />
        </span>
        <p className="font-display text-base font-semibold text-ink">Changelog not wired here</p>
        <p className="mx-auto max-w-md text-sm text-ink-2">
          The changelog tables aren&apos;t in this Supabase project yet. Push the
          <span className="font-mono text-xs"> 20260609100000_app_version_changelog.sql</span>{" "}
          migration to prod to enable this surface.
        </p>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** True when a PostgREST error reads like "relation/function does not exist". */
function isMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("not found")
  );
}

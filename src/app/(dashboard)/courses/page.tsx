import { SectionHeader } from "@/components/admin/SectionHeader";
import { TableToolbar, TableSelect, FilterChips } from "@/components/admin/table/TableToolbar";
import { TablePagination } from "@/components/admin/table/TablePagination";
import type { SortDir } from "@/components/admin/table/DataTable";
import { createClient } from "@/lib/supabase/server";
import { LAYOUT_LABELS, TIER_LABELS, type CourseLayout, type CourseTier } from "./types";
import { CoursesTable, type CourseTableRow } from "./CoursesTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const GAP_TYPES = ["photo", "description", "polygon", "stats"] as const;
type Gap = (typeof GAP_TYPES)[number];

type SearchParams = Promise<{
  q?: string;
  tier?: string;
  layout?: string;
  style?: string;
  county?: string;
  gap?: string;
  sort?: string;
  dir?: string;
  offset?: string;
}>;

const SORT_COLUMN: Record<string, string> = { name: "name", tier: "tier", updated: "updated_at" };

export default async function CoursesPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const tier = sp.tier ?? "all";
  const layout = sp.layout ?? "all";
  const style = sp.style ?? "all";
  const county = sp.county ?? "all";
  const gap = (GAP_TYPES.includes(sp.gap as Gap) ? sp.gap : null) as Gap | null;
  const sort = SORT_COLUMN[sp.sort ?? ""] ? (sp.sort as string) : "name";
  const dir: SortDir = sp.dir === "desc" ? "desc" : "asc";
  const offsetRaw = Number(sp.offset ?? 0);
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const supabase = await createClient();

  // A fresh head-count query carrying the base filters + one data gap. Inlined
  // (rather than a shared helper) so each builder keeps its own inferred type.
  const gapCountQuery = (g: Gap) => {
    let b = supabase.from("courses").select("id", { count: "exact", head: true });
    if (q) b = b.ilike("name", `%${q}%`);
    if (tier !== "all") b = b.eq("tier", tier);
    if (layout !== "all") b = b.eq("type", layout);
    if (style !== "all") b = b.eq("style", style);
    if (county !== "all") b = b.eq("county_id", county);
    if (g === "photo") b = b.is("hero_photo_storage_key", null);
    else if (g === "description") b = b.is("description", null);
    else if (g === "polygon") b = b.is("polygon", null); // filter only — never SELECT geometry
    else if (g === "stats") b = b.or("par.is.null,yards.is.null");
    return b;
  };

  // Main page query — count + the current 50 rows.
  let listQ = supabase
    .from("courses")
    .select(
      "id,name,club_id,county_id,tier,type,par,yards,style,description,hero_photo_storage_key,last_edited_by_admin_id,last_edited_at,updated_at,clubs(name),counties(name)",
      { count: "exact" },
    );
  if (q) listQ = listQ.ilike("name", `%${q}%`);
  if (tier !== "all") listQ = listQ.eq("tier", tier);
  if (layout !== "all") listQ = listQ.eq("type", layout); // bridge: column still `type`
  if (style !== "all") listQ = listQ.eq("style", style);
  if (county !== "all") listQ = listQ.eq("county_id", county);
  if (gap === "photo") listQ = listQ.is("hero_photo_storage_key", null);
  else if (gap === "description") listQ = listQ.is("description", null);
  else if (gap === "polygon") listQ = listQ.is("polygon", null);
  else if (gap === "stats") listQ = listQ.or("par.is.null,yards.is.null");
  const listPromise = listQ
    .order(SORT_COLUMN[sort], { ascending: dir === "asc" })
    .range(offset, offset + PAGE_SIZE - 1);

  const [listRes, stylesRes, countiesRes, ...gapCountResults] = await Promise.all([
    listPromise,
    supabase.rpc("distinct_course_styles"),
    supabase.from("counties").select("id,name").order("name", { ascending: true }),
    ...GAP_TYPES.map((g) => gapCountQuery(g)),
  ]);

  const gapCounts = Object.fromEntries(
    GAP_TYPES.map((g, i) => [g, gapCountResults[i].count ?? 0]),
  ) as Record<Gap, number>;

  const styles = (stylesRes.data ?? []) as string[];
  const counties = (countiesRes.data ?? []) as Array<{ id: string; name: string }>;
  const total = listRes.count ?? 0;

  // Resolve last-editor names in one round-trip.
  const adminIds = Array.from(
    new Set(
      (listRes.data ?? [])
        .map((r) => r.last_edited_by_admin_id)
        .filter((v): v is string => typeof v === "string"),
    ),
  );
  const adminNames: Record<string, string> = {};
  if (adminIds.length > 0) {
    const { data } = await supabase.from("users").select("id,display_name,username").in("id", adminIds);
    for (const u of data ?? []) adminNames[u.id] = u.display_name || u.username || "Admin";
  }

  const rows: CourseTableRow[] = (listRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    club_name: unwrap<{ name: string }>(r.clubs)?.name ?? null,
    county_name: unwrap<{ name: string }>(r.counties)?.name ?? null,
    tier: r.tier as CourseTier,
    layout: (r.type ?? "primary18") as CourseLayout,
    par: r.par,
    yards: r.yards,
    hasPhoto: Boolean(r.hero_photo_storage_key),
    hasDescription: Boolean(r.description && String(r.description).trim()),
    hasStats: r.par != null && r.yards != null,
    lastEditedByName: r.last_edited_by_admin_id ? (adminNames[r.last_edited_by_admin_id] ?? null) : null,
    updatedAt: r.updated_at,
  }));

  const hasFilters =
    Boolean(q) || tier !== "all" || layout !== "all" || style !== "all" || county !== "all" || Boolean(gap);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <SectionHeader eyebrow="Editorial" title="Courses" />

      <TableToolbar
        initialQuery={q}
        searchPlaceholder="Search course name…"
        countLabel={`${total.toLocaleString()} ${total === 1 ? "course" : "courses"}${gap ? ` · ${gapLabel(gap)}` : ""}`}
        hasFilters={hasFilters}
      >
        <TableSelect
          name="tier"
          label="Tier"
          value={tier}
          options={[
            { value: "all", label: "All tiers" },
            ...(Object.keys(TIER_LABELS) as CourseTier[]).map((v) => ({ value: v, label: TIER_LABELS[v] })),
          ]}
        />
        <TableSelect
          name="layout"
          label="Layout"
          value={layout}
          options={[
            { value: "all", label: "All layouts" },
            ...(Object.keys(LAYOUT_LABELS) as CourseLayout[]).map((v) => ({ value: v, label: LAYOUT_LABELS[v] })),
          ]}
        />
        <TableSelect
          name="county"
          label="County"
          value={county}
          options={[{ value: "all", label: "All counties" }, ...counties.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <TableSelect
          name="style"
          label="Style"
          value={style}
          options={[{ value: "all", label: "All styles" }, ...styles.map((s) => ({ value: s, label: s }))]}
        />
      </TableToolbar>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-3">Spot gaps</span>
        <FilterChips
          name="gap"
          value={gap}
          options={GAP_TYPES.map((g) => ({
            value: g,
            label: `${gapLabel(g)}${gapCounts[g] ? ` (${gapCounts[g].toLocaleString()})` : ""}`,
          }))}
        />
      </div>

      {listRes.error ? (
        <div className="rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load courses: {listRes.error.message}
        </div>
      ) : (
        <>
          <CoursesTable rows={rows} sort={sort} dir={dir} />
          <TablePagination offset={offset} pageSize={PAGE_SIZE} count={rows.length} hasMore={offset + rows.length < total} />
        </>
      )}
    </div>
  );
}

function gapLabel(g: Gap): string {
  switch (g) {
    case "photo":
      return "No photo";
    case "description":
      return "No description";
    case "polygon":
      return "No polygon";
    case "stats":
      return "No par/yards";
  }
}

function unwrap<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value as T;
}

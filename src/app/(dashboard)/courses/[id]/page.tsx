import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { courseCoverURL } from "@/lib/storage";
import { CourseEditor } from "./CourseEditor";
import {
  type CourseDetailRow,
  type CourseLayout,
  type CourseTier,
  type CuratedListChip,
  type GeoJSONPolygonOrMulti,
} from "../types";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

export default async function CourseDetailPage(props: { params: RouteParams }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [courseResult, stylesResult, curatedJoinResult] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id,legacy_fid,name,slug,club_id,county_id,tier,type,hole_count,par,yards,style,established,description,curated_list_ids,hero_photo_storage_key,polygon,center_lat,center_lng,last_edited_by_admin_id,last_edited_at,updated_at,created_at,clubs(name),counties(id,name)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("distinct_course_styles"),
    supabase
      .from("curated_list_courses")
      .select("curated_list_id,curated_lists(id,name)")
      .eq("course_id", id),
  ]);

  if (courseResult.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load course: {courseResult.error.message}
        </div>
      </div>
    );
  }
  if (!courseResult.data) notFound();

  const data = courseResult.data;
  const club = unwrapJoin<{ name: string }>(data.clubs);
  const county = unwrapJoin<{ id: string; name: string }>(data.counties);

  let lastEditedByName: string | null = null;
  if (data.last_edited_by_admin_id) {
    const { data: userRow } = await supabase
      .from("users")
      .select("display_name,username")
      .eq("id", data.last_edited_by_admin_id)
      .maybeSingle();
    if (userRow) {
      lastEditedByName = userRow.display_name || userRow.username || "Admin";
    }
  }

  const curatedLists: CuratedListChip[] = (curatedJoinResult.data ?? [])
    .map((row) => unwrapJoin<{ id: string; name: string }>(row.curated_lists))
    .filter((value): value is { id: string; name: string } => value != null);

  const styles: string[] = (stylesResult.data ?? []) as string[];

  const row: CourseDetailRow = {
    id: data.id,
    legacy_fid: data.legacy_fid,
    name: data.name,
    slug: data.slug,
    club_id: data.club_id,
    county_id: data.county_id,
    club_name: club?.name ?? null,
    county_name: county?.name ?? null,
    tier: data.tier as CourseTier,
    // Bridge: surface `type` under `layout` so UI vocabulary is correct.
    layout: (data.type ?? "primary18") as CourseLayout,
    hole_count: data.hole_count,
    par: data.par,
    yards: data.yards,
    style: data.style,
    established: data.established,
    description: data.description,
    curated_list_ids: data.curated_list_ids ?? [],
    hero_photo_storage_key: data.hero_photo_storage_key,
    polygon: data.polygon as GeoJSONPolygonOrMulti | null,
    center_lat: data.center_lat,
    center_lng: data.center_lng,
    last_edited_by_admin_id: data.last_edited_by_admin_id,
    last_edited_at: data.last_edited_at,
    last_edited_by_name: lastEditedByName,
    updated_at: data.updated_at,
    created_at: data.created_at,
    curated_lists: curatedLists,
  };

  const cover = courseCoverURL(row.hero_photo_storage_key);

  return <CourseEditor row={row} coverURL={cover} styles={styles} />;
}

function unwrapJoin<T>(value: unknown): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return value as T;
}

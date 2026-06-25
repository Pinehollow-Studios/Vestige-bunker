import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocietyEditor } from "./SocietyEditor";
import type { CountyOption, SocietyRow } from "../types";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

export default async function SocietyEditorPage(props: { params: RouteParams }) {
  const { id } = await props.params;
  const supabase = await createClient();

  // `admin_list_societies` is SECURITY DEFINER so it returns the target row
  // regardless of RLS membership; counties back the suggestion picker.
  const [listRes, countyRes] = await Promise.all([
    supabase.rpc("admin_list_societies"),
    supabase.from("counties").select("id,name").order("name"),
  ]);

  if (listRes.error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load society: {listRes.error.message}
        </div>
      </div>
    );
  }

  const row = (listRes.data as SocietyRow[] | null)?.find((r) => r.society_id === id);
  if (!row) notFound();

  const counties: CountyOption[] = (countyRes.data ?? []).map((c) => ({ id: c.id, name: c.name }));

  return <SocietyEditor row={row} counties={counties} />;
}

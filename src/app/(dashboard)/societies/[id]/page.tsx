import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModeEditor } from "./ModeEditor";
import type { SocietyModeRow } from "../types";

export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

export default async function ModeEditorPage(props: { params: RouteParams }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("society_modes")
    .select("id,key,name,tagline,description,glyph,color,enabled,sort_order,who_can_start,config,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load mode: {error.message}
        </div>
      </div>
    );
  }
  if (!data) notFound();

  return <ModeEditor mode={data as SocietyModeRow} />;
}

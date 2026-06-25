"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDevClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

/**
 * Create a fresh editorial society (captain-less, admin-managed) and redirect
 * into its editor. Only the name is needed at create-time — crest, colour and
 * the suggested county are set on the next page. Backed by
 * `admin_create_society` (gated by `is_admin()`).
 */
export async function createSociety(name: string): Promise<ActionResult<string>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Name is required." };

  const supabase = await createDevClient();
  const { data, error } = await supabase.rpc("admin_create_society", { p_name: trimmed });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/societies");
  redirect(`/societies/${data as string}`);
}

/** Patch the society name. */
export async function updateSocietyName(
  societyId: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, message: "Name can't be empty." };

  const supabase = await createDevClient();
  const { error } = await supabase.rpc("admin_update_society", {
    p_society: societyId,
    p_name: trimmed,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/societies");
  revalidatePath(`/societies/${societyId}`);
  return { ok: true };
}

/** Patch the crest (glyph + colour together — both always sent). */
export async function updateSocietyCrest(
  societyId: string,
  glyph: string,
  color: string,
): Promise<ActionResult> {
  const supabase = await createDevClient();
  const { error } = await supabase.rpc("admin_update_society", {
    p_society: societyId,
    p_crest: { glyph, color },
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/societies");
  revalidatePath(`/societies/${societyId}`);
  return { ok: true };
}

/** Set (or clear, with null) the home county this society is suggested to. */
export async function setSocietyCounty(
  societyId: string,
  countyId: string | null,
): Promise<ActionResult> {
  const supabase = await createDevClient();
  const { error } = await supabase.rpc("admin_update_society", {
    p_society: societyId,
    p_editorial_suggest_county_id: countyId,
    p_clear_county: countyId === null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/societies");
  revalidatePath(`/societies/${societyId}`);
  return { ok: true };
}

/** Delete an editorial society (cascades members + invites). */
export async function deleteSociety(societyId: string): Promise<ActionResult> {
  const supabase = await createDevClient();
  const { error } = await supabase.rpc("admin_delete_society", { p_society: societyId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/societies");
  redirect("/societies");
}

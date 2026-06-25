/**
 * Shared types for the societies admin surface.
 *
 * Mirrors the iOS-side `Society` / `SocietyCrest` types
 * (`Vestige/Models/Society.swift`) so field names + meaning stay aligned across
 * the two clients reading the same Supabase tables. Columns are documented in
 * `20260625130000_societies_p1_foundation.sql` +
 * `20260625140000_societies_admin_editorial.sql`.
 *
 * Editorial (preset) societies are the only ones editable here — they're the
 * Jack-seeded "London Clubs" style groups suggested to users by home county.
 */

/** Wire shape of the `societies.crest` jsonb. */
export type SocietyCrestData = {
  glyph?: string | null;
  color?: string | null;
};

/** A row from `admin_list_societies()`. */
export type SocietyRow = {
  society_id: string;
  name: string;
  crest: SocietyCrestData | null;
  cover_storage_key: string | null;
  member_count: number;
  is_editorial: boolean;
  editorial_suggest_county_id: string | null;
  county_name: string | null;
  captain_user_id: string | null;
  created_at: string;
};

export type CountyOption = { id: string; name: string };

/** Crest colour tokens — must match iOS `SocietyCrestView.tint(for:)`. */
export const CREST_COLORS: { token: string; label: string; hex: string }[] = [
  { token: "mint", label: "Mint", hex: "#5BE4C3" },
  { token: "lime", label: "Lime", hex: "#8FE85B" },
  { token: "amber", label: "Amber", hex: "#E5A13A" },
  { token: "claret", label: "Claret", hex: "#B23A55" },
  { token: "sea", label: "Sea", hex: "#3E7CA6" },
];

export const DEFAULT_CREST = { glyph: "flag.fill", color: "mint" };

export function crestColorHex(token: string | null | undefined): string {
  return CREST_COLORS.find((c) => c.token === token)?.hex ?? CREST_COLORS[0].hex;
}

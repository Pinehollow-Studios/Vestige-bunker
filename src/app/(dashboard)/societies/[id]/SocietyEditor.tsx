"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EditorSection,
  EditorShell,
  Field,
  fieldInputClass,
} from "@/components/admin/editor/EditorShell";
import { useFormAutosave } from "@/lib/hooks/useFormAutosave";
import { cn } from "@/lib/utils";
import { CREST_GLYPHS, SocietyCrest } from "../SocietyCrest";
import {
  CREST_COLORS,
  DEFAULT_CREST,
  crestColorHex,
  type CountyOption,
  type SocietyRow,
} from "../types";
import {
  deleteSociety,
  setSocietyCounty,
  updateSocietyCrest,
  updateSocietyName,
} from "../actions";

export function SocietyEditor({
  row,
  counties,
}: {
  row: SocietyRow;
  counties: CountyOption[];
}) {
  const { values, setField, state } = useFormAutosave<{ name: string }>(
    { name: row.name },
    (patch) => updateSocietyName(row.society_id, patch.name ?? row.name),
  );
  const [glyph, setGlyph] = useState(row.crest?.glyph ?? DEFAULT_CREST.glyph);
  const [color, setColor] = useState(row.crest?.color ?? DEFAULT_CREST.color);
  const [countyId, setCountyId] = useState(row.editorial_suggest_county_id ?? "");
  const [pending, startTransition] = useTransition();

  // Member-created societies are surfaced read-only for awareness.
  if (!row.is_editorial) {
    return (
      <EditorShell
        backHref="/societies"
        backLabel="Societies"
        eyebrow="Member-created"
        title={row.name}
      >
        <EditorSection
          title="Read only"
          hint="Member-created societies are run by their captain in the app and aren't editable here."
        >
          <p className="text-sm text-ink-2">
            {row.member_count} {row.member_count === 1 ? "member" : "members"}
            {row.county_name ? ` · ${row.county_name}` : ""}.
          </p>
        </EditorSection>
      </EditorShell>
    );
  }

  function saveCrest(nextGlyph: string, nextColor: string) {
    setGlyph(nextGlyph);
    setColor(nextColor);
    startTransition(async () => {
      const result = await updateSocietyCrest(row.society_id, nextGlyph, nextColor);
      if (!result.ok) toast.error(result.message);
    });
  }

  function saveCounty(next: string) {
    setCountyId(next);
    startTransition(async () => {
      const result = await setSocietyCounty(row.society_id, next || null);
      if (!result.ok) toast.error(result.message);
    });
  }

  function onDelete() {
    if (!confirm("Delete this society? This removes it for everyone and can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteSociety(row.society_id);
      if (!result.ok) toast.error(result.message);
    });
  }

  const preview = (
    <div className="space-y-3 rounded-xl glass-panel p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Preview</p>
      <div className="flex items-center gap-3">
        <SocietyCrest glyph={glyph} color={color} size={56} />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{values.name || "Untitled society"}</p>
          <p className="text-xs text-ink-3">
            {row.member_count} {row.member_count === 1 ? "member" : "members"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <EditorShell
      backHref="/societies"
      backLabel="Societies"
      eyebrow="Editorial society"
      title={values.name || "Untitled society"}
      saveState={state}
      aside={preview}
    >
      <EditorSection title="Identity" hint="The name + crest shown in the app.">
        <Field label="Name" htmlFor="society-name">
          <input
            id="society-name"
            className={fieldInputClass}
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="London Clubs"
          />
        </Field>

        <Field label="Crest glyph">
          <div className="grid grid-cols-4 gap-2">
            {CREST_GLYPHS.map((g) => {
              const active = g.token === glyph;
              return (
                <button
                  key={g.token}
                  type="button"
                  aria-label={g.label}
                  onClick={() => saveCrest(g.token, color)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border transition-colors",
                    active
                      ? "border-brand/60 bg-brand/10"
                      : "border-input bg-paper-sunken/40 text-ink-2 hover:bg-paper-sunken",
                  )}
                >
                  <g.icon
                    className="size-5"
                    style={active ? { color: crestColorHex(color) } : undefined}
                  />
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Crest colour">
          <div className="flex flex-wrap gap-2.5">
            {CREST_COLORS.map((c) => (
              <button
                key={c.token}
                type="button"
                aria-label={c.label}
                onClick={() => saveCrest(glyph, c.token)}
                className={cn(
                  "size-8 rounded-full transition-transform hover:scale-105",
                  c.token === color && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </Field>
      </EditorSection>

      <EditorSection
        title="Suggested to"
        hint="Players whose home county matches see this society as a suggestion to join. Leave as “Anyone” to suggest it everywhere."
      >
        <Field label="Home county">
          <select
            className={fieldInputClass}
            value={countyId}
            onChange={(e) => saveCounty(e.target.value)}
          >
            <option value="">Anyone (no county)</option>
            {counties.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </EditorSection>

      <EditorSection title="Danger zone" hint="Deleting removes the society for every member.">
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={pending}
          className="text-alert hover:bg-alert/10"
        >
          Delete society
        </Button>
      </EditorSection>
    </EditorShell>
  );
}

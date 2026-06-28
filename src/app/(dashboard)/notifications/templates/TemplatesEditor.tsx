"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { saveNotificationTemplate, type NotificationTemplateRow } from "../actions";
import { previewTemplate, TEMPLATE_KINDS, type TemplateKindMeta } from "./templates-meta";

export function TemplatesEditor({ overrides }: { overrides: Record<string, NotificationTemplateRow> }) {
  const groups = useMemo(() => {
    const m = new Map<string, TemplateKindMeta[]>();
    for (const k of TEMPLATE_KINDS) {
      const arr = m.get(k.category) ?? [];
      arr.push(k);
      m.set(k.category, arr);
    }
    return [...m.entries()];
  }, []);

  return (
    <div className="space-y-6">
      {groups.map(([category, kinds]) => (
        <section key={category} className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{category}</h3>
          <div className="space-y-2">
            {kinds.map((meta) => (
              <KindCard key={meta.kind} meta={meta} override={overrides[meta.kind]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type Field = "pushTitle" | "pushBody" | "inboxTitle" | "inboxBody";

function KindCard({ meta, override }: { meta: TemplateKindMeta; override?: NotificationTemplateRow }) {
  const [open, setOpen] = useState(false);
  const [pushTitle, setPushTitle] = useState(override?.push_title ?? "");
  const [pushBody, setPushBody] = useState(override?.push_body ?? "");
  const [inboxTitle, setInboxTitle] = useState(override?.inbox_title ?? "");
  const [inboxBody, setInboxBody] = useState(override?.inbox_body ?? "");
  const [active, setActive] = useState<Field>("inboxTitle");
  const [pending, start] = useTransition();

  const overridden = Boolean(
    override && (override.push_title || override.push_body || override.inbox_title || override.inbox_body),
  );

  const setters: Record<Field, (s: string) => void> = {
    pushTitle: setPushTitle, pushBody: setPushBody, inboxTitle: setInboxTitle, inboxBody: setInboxBody,
  };
  const values: Record<Field, string> = { pushTitle, pushBody, inboxTitle, inboxBody };

  function insertToken(tok: string) {
    const cur = values[active];
    setters[active](cur ? `${cur} {${tok}}` : `{${tok}}`);
  }

  function save() {
    start(async () => {
      const r = await saveNotificationTemplate(meta.kind, pushTitle, pushBody, inboxTitle, inboxBody);
      if (!r.ok) toast.error(r.message);
      else toast.success(`Saved · ${r.data ?? 0} past notification${r.data === 1 ? "" : "s"} updated`);
    });
  }

  function reset() {
    setPushTitle(""); setPushBody(""); setInboxTitle(""); setInboxBody("");
    start(async () => {
      const r = await saveNotificationTemplate(meta.kind, "", "", "", "");
      if (!r.ok) toast.error(r.message);
      else toast.success("Reset to default");
    });
  }

  const pushPreviewTitle = previewTemplate(pushTitle || meta.defaults.pushTitle, meta.tokens);
  const pushPreviewBody = previewTemplate(pushBody || meta.defaults.pushBody, meta.tokens);
  const inboxPreviewTitle = previewTemplate(inboxTitle || meta.defaults.inboxTitle, meta.tokens);
  const inboxPreviewBody = previewTemplate(inboxBody || meta.defaults.inboxBody, meta.tokens);

  return (
    <div className="rounded-xl glass-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="font-medium text-ink">{meta.label}</span>
          {overridden && (
            <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
              Edited
            </span>
          )}
        </span>
        <ChevronDown className={cn("size-4 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-rule/50 p-4">
          {meta.tokens.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-3">Insert:</span>
              {meta.tokens.map((t) => (
                <button
                  key={t.token}
                  type="button"
                  onClick={() => insertToken(t.token)}
                  title={t.desc}
                  className="rounded-full border border-rule/70 bg-paper-sunken/60 px-2 py-0.5 font-mono text-[11px] text-ink-2 transition hover:border-brand/40 hover:text-brand"
                >
                  {`{${t.token}}`}
                </button>
              ))}
            </div>
          )}

          <FieldBlock label="Lock-screen push">
            <Field label="Title" value={pushTitle} placeholder={meta.defaults.pushTitle} onChange={setPushTitle} onFocus={() => setActive("pushTitle")} />
            <Field label="Body" value={pushBody} placeholder={meta.defaults.pushBody} onChange={setPushBody} onFocus={() => setActive("pushBody")} />
            <Preview>
              <span className="font-semibold text-ink">{pushPreviewTitle}</span>
              {pushPreviewBody && <span className="text-ink-2"> — {pushPreviewBody}</span>}
            </Preview>
          </FieldBlock>

          <FieldBlock label="In-app inbox">
            <Field label="Headline (supports *bold*)" value={inboxTitle} placeholder={meta.defaults.inboxTitle} onChange={setInboxTitle} onFocus={() => setActive("inboxTitle")} />
            <Field label="Subline (optional)" value={inboxBody} placeholder={meta.defaults.inboxBody || "—"} onChange={setInboxBody} onFocus={() => setActive("inboxBody")} />
            <Preview>
              <span className="font-semibold text-ink">{inboxPreviewTitle}</span>
              {inboxPreviewBody && <span className="block text-ink-2">{inboxPreviewBody}</span>}
            </Preview>
          </FieldBlock>

          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={pending} size="sm" className="bg-brand text-brand-fg hover:bg-brand-deep">
              {pending ? "Saving…" : "Save"}
            </Button>
            {overridden && (
              <Button onClick={reset} disabled={pending} size="sm" variant="ghost" className="text-ink-2">
                Reset to default
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-rule/60 bg-paper-sunken/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label, value, placeholder, onChange, onFocus,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (s: string) => void;
  onFocus: () => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} />
    </div>
  );
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-rule/50 bg-paper-raised/40 px-3 py-2 text-sm">
      <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-ink-3">Preview</span>
      {children}
    </div>
  );
}

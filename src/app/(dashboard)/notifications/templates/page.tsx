import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { loadNotificationTemplates, type NotificationTemplateRow } from "../actions";
import { TemplatesEditor } from "./TemplatesEditor";

export const dynamic = "force-dynamic";

export default async function NotificationTemplatesPage() {
  await requireAdmin();
  const res = await loadNotificationTemplates();
  const overrides: Record<string, NotificationTemplateRow> = {};
  if (res.ok) for (const r of res.data ?? []) overrides[r.kind] = r;

  const notConfigured = !res.ok && isMissingRelation(res.message);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Notifications
      </Link>
      <SectionHeader eyebrow="Editorial" title="Notification copy" />

      {notConfigured ? (
        <div className="rounded-xl glass-panel p-8 text-center text-sm text-ink-2">
          The notification-templates table isn&apos;t in this Supabase project yet. Apply the{" "}
          <span className="font-mono text-xs">20260628110000_notification_templates.sql</span> migration.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm text-alert">
          Failed to load templates: {res.message}
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-2">
            Edit the wording of every automatic notification — the lock-screen push and the in-app inbox.
            Use <span className="font-mono text-xs">{"{tokens}"}</span> for the dynamic bits and{" "}
            <span className="font-mono text-xs">*bold*</span> to emphasise part of the inbox line. Leave a field
            blank to keep its built-in default. Saving also updates the in-app copy of past notifications of that kind.
          </p>
          <TemplatesEditor overrides={overrides} />
        </>
      )}
    </div>
  );
}

function isMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find") || m.includes("schema cache") || m.includes("not found");
}

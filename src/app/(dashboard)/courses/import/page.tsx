import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getImportStatus } from "./actions";
import { ImportConsole } from "./ImportConsole";

export const dynamic = "force-dynamic";

export default async function CourseImportPage() {
  const admin = await requireAdmin();
  const status = await getImportStatus();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All courses
      </Link>

      <SectionHeader eyebrow="Editorial · dataset" title="Course dataset" />

      <ImportConsole status={status} isSuperAdmin={admin.role === "super_admin"} />
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Section + sub-page label for the top bar, derived from the path. */
const SECTION: Record<string, string> = {
  "": "Overview",
  curated: "Curated lists",
  courses: "Courses",
  badges: "Badges",
  announcements: "Announcements",
  changelog: "Changelog",
  feedback: "Feedback",
  photos: "Photos",
  safeguarding: "Safeguarding",
  crashes: "Crashes",
  lists: "List verification",
  users: "Users",
  analytics: "Analytics",
  "app-version": "App version",
  sync: "Sync",
};

export function PageContext() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const section = SECTION[segments[0] ?? ""] ?? "Dashboard";
  const hasDetail = segments.length > 1;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 max-w-[45vw] items-center gap-1.5 text-sm sm:max-w-none"
    >
      <span className={cn("truncate", hasDetail ? "text-ink-3" : "font-medium text-ink")}>
        {section}
      </span>
      {hasDetail && (
        <>
          <ChevronRight aria-hidden className="size-3.5 text-ink-3/60" />
          <span className="truncate font-medium text-ink">Detail</span>
        </>
      )}
    </nav>
  );
}

import { PageSkeleton } from "@/components/admin/Skeleton";

/**
 * Shown the instant you navigate to any dashboard page, while that page's
 * server data resolves. Before this existed, every navigation was a blank
 * wait on the slowest query; now the shell stays put and the content area
 * shows a skeleton immediately. The single biggest perceived-speed win.
 */
export default function DashboardLoading() {
  return <PageSkeleton />;
}

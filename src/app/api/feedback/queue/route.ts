import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/apiGuard";
import { fetchFeedbackQueue, parseFeedbackFilters } from "@/lib/feedback/queue";

/**
 * Live feedback-queue read for the inbox. Same filters as the page (parsed from
 * the URL), so a Realtime refresh / "load more" returns the identical shape the
 * server first painted. Admin-gated.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (guard.error) return guard.error;

  const filters = parseFeedbackFilters(req.nextUrl.searchParams);
  const offsetParam = req.nextUrl.searchParams.get("offset");
  const offset = offsetParam != null ? Math.max(0, Number(offsetParam) || 0) : undefined;

  const result = await fetchFeedbackQueue(guard.supabase, filters, offset);
  return NextResponse.json(result);
}

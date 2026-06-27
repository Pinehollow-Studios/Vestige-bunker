import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tryCreateServiceClient } from "@/lib/supabase/admin";
import { sanitizeFilterValue } from "@/lib/security/postgrest";

/**
 * Global command-palette search. Gated to admins; reads from the active view
 * (prod by default, dev via the hidden switch). Users go through service-role
 * (public.users has no admin SELECT policy); everything else through the
 * session client (RLS-gated). Missing tables degrade to empty groups.
 */

export type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

export type SearchGroup = {
  key: string;
  label: string;
  items: SearchItem[];
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }
  const roleRes = await supabase.rpc("admin_role");
  if (roleRes.error || !roleRes.data) {
    return NextResponse.json({ groups: [] }, { status: 403 });
  }

  // Strip characters that break PostgREST `or` / `ilike` filters.
  const q = sanitizeFilterValue(req.nextUrl.searchParams.get("q") ?? "");
  if (q.length < 2) {
    return NextResponse.json({ groups: [] satisfies SearchGroup[] });
  }
  const like = `%${q}%`;

  const svc = await tryCreateServiceClient();
  const usersClient = svc ?? supabase;

  const [usersRes, coursesRes, feedbackRes, curatedRes, badgesRes] = await Promise.all([
    usersClient
      .from("users")
      .select("id, username, display_name")
      .or(`username.ilike.${like},display_name.ilike.${like}`)
      .limit(6),
    supabase
      .from("courses")
      .select("id, name, slug")
      .or(`name.ilike.${like},slug.ilike.${like}`)
      .limit(6),
    supabase
      .from("feedback_reports")
      .select("id, body, kind")
      .ilike("body", like)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("curated_lists").select("id, name").ilike("name", like).limit(5),
    supabase.from("badge_definitions").select("id, name").ilike("name", like).limit(5),
  ]);

  const groups: SearchGroup[] = [];

  const users = (usersRes.data ?? []) as Array<{
    id: string;
    username: string | null;
    display_name: string | null;
  }>;
  if (users.length) {
    groups.push({
      key: "users",
      label: "Users",
      items: users.map((u) => ({
        id: u.id,
        title: u.display_name?.trim() || (u.username ? `@${u.username}` : "Unknown user"),
        subtitle: u.username ? `@${u.username}` : undefined,
        href: `/users/${u.id}`,
      })),
    });
  }

  const courses = (coursesRes.data ?? []) as Array<{
    id: string;
    name: string;
    slug: string | null;
  }>;
  if (courses.length) {
    groups.push({
      key: "courses",
      label: "Courses",
      items: courses.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.slug ?? undefined,
        href: `/courses/${c.id}`,
      })),
    });
  }

  const feedback = (feedbackRes.data ?? []) as Array<{
    id: string;
    body: string;
    kind: string;
  }>;
  if (feedback.length) {
    groups.push({
      key: "feedback",
      label: "Feedback",
      items: feedback.map((f) => ({
        id: f.id,
        title: snippet(f.body),
        subtitle: f.kind,
        href: `/feedback/${f.id}`,
      })),
    });
  }

  const curated = (curatedRes.data ?? []) as Array<{ id: string; name: string }>;
  if (curated.length) {
    groups.push({
      key: "curated",
      label: "Curated lists",
      items: curated.map((c) => ({ id: c.id, title: c.name, href: `/curated/${c.id}` })),
    });
  }

  const badges = (badgesRes.data ?? []) as Array<{ id: string; name: string }>;
  if (badges.length) {
    groups.push({
      key: "badges",
      label: "Badges",
      items: badges.map((b) => ({ id: b.id, title: b.name, href: `/badges/${b.id}` })),
    });
  }

  return NextResponse.json({ groups });
}

function snippet(body: string): string {
  const t = body.trim().replace(/\s+/g, " ");
  return t.length <= 64 ? t : t.slice(0, 61) + "…";
}

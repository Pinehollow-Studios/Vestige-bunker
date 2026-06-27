# Vestige Admin — Security

> Internal security model + audit record for the admin dashboard. This app is
> private (no public users) and will hold sensitive operational data. Goal:
> strong defense-in-depth. No system is ever literally "impenetrable" — this
> documents what's hardened and what's still tracked.

## Security model

- **Two enforced auth layers.** `middleware.ts` runs on every non-static route,
  verifies the session with `supabase.auth.getUser()` (a real server check, not
  the unverified `getSession()`), and **fails closed** (redirect to `/login`).
  Then `requireAdmin()` (`src/lib/auth/requireAdmin.ts`, in the `(dashboard)`
  layout) and `requireAdminApi()` (`src/lib/auth/apiGuard.ts`, in every
  `/api/**` route) call the `admin_role` SECURITY DEFINER RPC and fail closed
  (`/unauthorized` / 401-403). Authorization is enforced in Postgres (RLS +
  `is_admin()`), so a spoofed JWT can't bypass it.
- **Secrets are server-only.** Service-role keys (`lib/supabase/admin.ts`,
  `lib/sync/clients.ts`) and API tokens (`lib/sentry/client.ts`,
  `lib/github/dispatch.ts`) all `import "server-only"`, are never `NEXT_PUBLIC_`,
  and are never imported by a client component. `.env*` is gitignored (only
  `.env.example` is tracked); no secrets are committed.
- **HTTP headers** (`next.config.ts`) apply to every response: a Content-Security
  -Policy, HSTS, `X-Frame-Options: DENY` + `frame-ancestors 'none'`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  `X-DNS-Prefetch-Control: off`.
- **Input safety.** User input interpolated into PostgREST `.or()` filter strings
  is sanitised with `sanitizeFilterValue()` (`src/lib/security/postgrest.ts`);
  dynamic UUID route params are validated with `isUuid()`. Redirect targets are
  validated with `safeNextPath()` (`src/lib/security/redirect.ts`). React
  auto-escaping covers rendered DB content (no `dangerouslySetInnerHTML`).
- **Not indexable.** `src/app/robots.ts` disallows all crawlers; the login page
  sets `noindex` and gives nothing away (no branding / product name / hints).

## Audit — 2026-06-27

Full audit (injection/XSS, secrets/service-role, auth/session sweeps + direct
review + dependency scan). Findings and resolutions:

| Finding | Severity | Resolution |
|---|---|---|
| No HTTP security headers | High | Added CSP/HSTS/anti-clickjacking/nosniff/etc. in `next.config.ts` |
| Open redirect via `next` in `auth/callback` | Med-High | `safeNextPath()` validates a local path |
| PostgREST `.or()` filter injection (announcements, users, crashes, users/[id]) | Medium | `sanitizeFilterValue()` / `isUuid()`; one shared helper |
| Dependency CVEs — 11 (4 high: `ws`; Next.js middleware-bypass/XSS/cache-poison) | High | `npm audit fix` + Next `16.2.4 → 16.2.9` + `postcss` override → **0 vulns** |
| No login brute-force throttle | Medium | In-memory per-instance limiter (stopgap — see below) |
| `sentry/client.ts` lacked `server-only` | Low | Added `import "server-only"` |
| Admin app indexable | Low | `robots.ts` disallow-all |

Verified clean: `requireAdmin`/`requireAdminApi` gates, `getUser()` everywhere,
secrets server-only, `.env` gitignored, no hardcoded secrets, Server Actions
CSRF (Next's built-in Origin/Host check).

## Tracked follow-ups

1. **Nonce-based strict CSP.** The CSP currently allows `'unsafe-inline'` for
   scripts (pragmatic — Next injects inline bootstrap; React auto-escapes; no
   `dangerouslySetInnerHTML`). Upgrade to per-request nonces via middleware to
   drop `'unsafe-inline'`. Needs an authenticated test pass across all pages.
2. **Cross-instance login rate-limiting.** The in-memory limiter in
   `src/app/login/actions.ts` is per serverless instance only; Supabase Auth's
   own throttling is the real backstop. Wire Vercel KV / Upstash for a shared,
   durable limiter.
3. **`admins`-table prod gate.** Per `CLAUDE.md §4`, confirm the production
   `admins` gate + roster bootstrap before storing the most sensitive data.

## Reporting

Found something? Tell Tom directly — do not open a public issue.

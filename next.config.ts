import type { NextConfig } from "next";

/**
 * Security headers. Applied to every response (see `headers()` below).
 *
 * The CSP is built from the public env so project URLs are never hardcoded:
 * Supabase (REST + Realtime over wss://), Mapbox (static-map images + telemetry),
 * and an optional Metabase embed. `'unsafe-inline'` for scripts is a deliberate
 * pragmatic choice for now — Next injects small inline bootstrap scripts, React
 * auto-escapes, and the app has no `dangerouslySetInnerHTML`. A nonce-based
 * strict script CSP is the tracked follow-up (needs middleware nonce wiring +
 * an authenticated test pass). `'unsafe-eval'` is dev-only (Turbopack/HMR) and
 * never ships to production. See SECURITY.md.
 */
const isDev = process.env.NODE_ENV !== "production";

/** Collect https origins (+ their wss:// form for Supabase Realtime) from URLs. */
function originsFrom(...urls: Array<string | undefined>): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    if (!u) continue;
    try {
      const { origin, host } = new URL(u);
      out.add(origin);
      out.add(`wss://${host}`);
    } catch {
      /* ignore malformed env */
    }
  }
  return [...out];
}

const supabaseOrigins = originsFrom(
  process.env.NEXT_PUBLIC_SUPABASE_URL_PROD,
  process.env.NEXT_PUBLIC_SUPABASE_URL_DEV,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

let metabaseOrigin = "";
try {
  if (process.env.NEXT_PUBLIC_METABASE_DASHBOARD_URL) {
    metabaseOrigin = new URL(process.env.NEXT_PUBLIC_METABASE_DASHBOARD_URL).origin;
  }
} catch {
  /* ignore malformed env */
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // Images: Supabase storage avatars/covers + Mapbox static maps. https: is a
  // pragmatic allowance (images can't execute); data:/blob: for inline + crops.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  ["connect-src 'self'", ...supabaseOrigins, "https://api.mapbox.com", "https://events.mapbox.com"].join(" "),
  ["frame-src 'self'", metabaseOrigin].filter(Boolean).join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, subdomains, preload-eligible. Ignored over http (local dev).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

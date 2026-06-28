import { Bell, BatteryFull, Wifi } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Realistic iOS + in-app notification previews for the dashboard. Rendered with
 * literal iOS colours (not dashboard theme tokens) so they read as the real
 * thing regardless of the admin theme.
 */

/** The Vestige app icon — mint→lime gradient squircle + dark golf flag. */
export function VestigeAppIcon({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.224),
        background: "linear-gradient(145deg, #5BE4C3 0%, #8FE85B 100%)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.18), inset 0 0 0 0.5px rgba(255,255,255,0.35)",
      }}
      className="flex shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 100 100" fill="none">
        <rect x="45" y="17" width="5.5" height="66" rx="2.75" fill="#0E1822" />
        <path d="M50.5 19 L82 30.5 L50.5 42 Z" fill="#0E1822" />
        <ellipse cx="50" cy="86" rx="23" ry="5.5" fill="#0E1822" opacity="0.3" />
      </svg>
    </div>
  );
}

function stripStars(s: string): string {
  return s.replace(/\*/g, "");
}

/** Render `*bold*` segments as bold spans (for the in-app inbox surface). */
function boldSegments(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  let bold = false;
  s.split("*").forEach((seg, i) => {
    if (seg) out.push(bold ? <strong key={i} className="font-semibold">{seg}</strong> : <span key={i}>{seg}</span>);
    bold = !bold;
  });
  return out;
}

/** A single iOS notification banner (the lock-screen / banner card). */
export function IOSNotification({
  title,
  body,
  time = "now",
}: {
  title: string;
  body: string;
  time?: string;
}) {
  return (
    <div className="flex gap-2.5 rounded-[20px] bg-white/85 px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ring-1 ring-black/5 backdrop-blur-2xl">
      <VestigeAppIcon size={38} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#1c1c1e]">
            {stripStars(title) || "Title"}
          </p>
          <span className="shrink-0 text-[12px] font-medium text-black/40">{time}</span>
        </div>
        {stripStars(body) && (
          <p className="mt-0.5 line-clamp-4 text-[14px] leading-snug text-[#1c1c1e]/90">{stripStars(body)}</p>
        )}
      </div>
    </div>
  );
}

/** A full iOS lock screen with the clock + the notification — the hero preview. */
export function IOSLockScreen({
  title,
  body,
  maxWidth = 248,
}: {
  title: string;
  body: string;
  maxWidth?: number;
}) {
  return (
    <div
      style={{ maxWidth, aspectRatio: "9 / 16", background: "linear-gradient(165deg,#22325a 0%,#141d33 45%,#0a0f1a 100%)" }}
      className="relative mx-auto w-full overflow-hidden rounded-[2.4rem] ring-1 ring-black/30 shadow-2xl"
    >
      {/* status bar */}
      <div className="flex items-center justify-between px-6 pt-2.5 text-[11px] font-semibold text-white">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <Wifi className="size-3" />
          <BatteryFull className="size-3.5" />
        </span>
      </div>
      {/* clock */}
      <div className="pointer-events-none mt-7 text-center text-white">
        <p className="text-[12px] font-medium text-white/75">Monday, 28 June</p>
        <p className="mt-0.5 font-display text-[60px] font-semibold leading-none tracking-tight">9:41</p>
      </div>
      {/* notification */}
      <div className="absolute inset-x-3 bottom-14">
        <IOSNotification title={title} body={body} />
      </div>
    </div>
  );
}

/** The in-app inbox row (Vestige dark "Atlas" surface) — for the inbox copy. */
export function VestigeInboxRow({
  title,
  body,
  icon,
  unread = true,
}: {
  title: string;
  body: string;
  icon?: ReactNode;
  unread?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-3.5 py-3"
      style={{ background: "rgba(20,34,53,0.92)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[#0E1822]"
        style={{ background: "linear-gradient(145deg,#5BE4C3,#8FE85B)" }}
      >
        {icon ?? <Bell className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-snug text-[#F3F0E5]">{boldSegments(title) || "Headline"}</p>
        {stripStars(body) && <p className="text-[12px] leading-snug text-[#F3F0E5]/55">{stripStars(body)}</p>}
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#F3F0E5]/35">now</p>
      </div>
      {unread && <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: "#5BE4C3" }} />}
    </div>
  );
}

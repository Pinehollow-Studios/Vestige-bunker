"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { signOut } from "@/app/(dashboard)/actions";
import { VAULT_TAB_KEY, VAULT_UNLOCK_KEY } from "@/lib/auth/vault";

/**
 * The vault gate — a full-screen blast-door overlay that sits over the whole
 * dashboard on first paint and does two jobs:
 *
 * 1. **Re-auth on a fresh tab.** sessionStorage is per-tab and dies with the
 *    tab. If the "this tab authenticated" stamp is missing (a reopened tab),
 *    the session is torn down via {@link signOut} and the operator is bounced
 *    back to the login screen — you re-enter the vault every time you reopen it.
 *
 * 2. **The unlock theatre.** Straight after a successful sign-in the gate plays
 *    a big vault-opening sequence (spinning wheel → bolts retract → blast doors
 *    part) before revealing the dashboard. A plain in-tab reload gets a quick
 *    unseal instead; reduced-motion gets an instant reveal.
 *
 * Because the overlay is server-rendered closed by default it also stops any
 * secure content from flashing on a reopened tab before the logout fires.
 */

type Phase = "sealed" | "opening" | "relock" | "open";
type Mode = "full" | "quick";

// Rivet ring + retracting bolts, computed deterministically. Coordinates are
// rounded so server and client agree to the digit — Math.cos/sin can differ by
// ~1e-14 across JS engines, which would otherwise trip a hydration mismatch.
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const RIVETS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  return { x: round3(100 + Math.cos(a) * 86), y: round3(100 + Math.sin(a) * 86) };
});
const BOLTS = Array.from({ length: 8 }, (_, i) => (i / 8) * 360);

const FULL_SEQUENCE: [number, string][] = [
  [0, "AUTHENTICATING"],
  [780, "DECRYPTING SESSION"],
  [1560, "RETRACTING BOLTS"],
  [2160, "VAULT OPEN"],
];

export function VaultGate() {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [mode, setMode] = useState<Mode>("full");
  const [status, setStatus] = useState("SEALED");

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) =>
      timers.push(setTimeout(() => !cancelled && fn(), ms));

    let alive = false;
    let unlock = false;
    try {
      alive = sessionStorage.getItem(VAULT_TAB_KEY) === "1";
      unlock = sessionStorage.getItem(VAULT_UNLOCK_KEY) === "1";
      sessionStorage.removeItem(VAULT_UNLOCK_KEY);
    } catch {
      // sessionStorage blocked (private mode / hardened browser): treat it as a
      // fresh tab so we fail closed toward re-authentication.
      alive = false;
    }

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Kick the sequence off the effect body (via rAF) so we never call setState
    // synchronously on mount. The default "sealed" render keeps content covered
    // for the one frame until this fires, so nothing flashes through.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!alive) {
        // Reopened tab → seal it shut and force a full re-login.
        setMode("full");
        setStatus("RE-AUTHENTICATION REQUIRED");
        setPhase("relock");
        after(900, () => void signOut());
        // Belt-and-braces: if the action can't redirect for any reason.
        after(4000, () => window.location.assign("/login"));
      } else if (reduce) {
        setMode("quick");
        setPhase("opening");
        after(420, () => setPhase("open"));
      } else if (unlock) {
        setMode("full");
        setPhase("opening");
        FULL_SEQUENCE.forEach(([t, s]) => after(t, () => setStatus(s)));
        after(2900, () => setPhase("open"));
      } else {
        // Plain in-tab reload: a quick unseal, no full ceremony.
        setMode("quick");
        setPhase("opening");
        after(760, () => setPhase("open"));
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "open") return null;

  const locked = phase === "relock";

  return (
    <div className="vlt" data-phase={phase} data-mode={mode} role="presentation" aria-hidden>
      <div className="vlt-door vlt-door-l" />
      <div className="vlt-door vlt-door-r" />
      <div className="vlt-vignette" />

      <div className={locked ? "vlt-core vlt-core-locked" : "vlt-core"}>
        <svg viewBox="0 0 200 200" className="vlt-wheel">
          <circle cx="100" cy="100" r="94" className="vlt-ring vlt-ring-1" />
          <circle cx="100" cy="100" r="80" className="vlt-ring vlt-ring-2" />
          {RIVETS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.4" className="vlt-rivet" />
          ))}

          {/* Radial locking bolts — retract toward the hub on unlock. */}
          <g className="vlt-bolts">
            {BOLTS.map((deg, i) => (
              <rect
                key={i}
                x="97"
                y="18"
                width="6"
                height="26"
                rx="3"
                className="vlt-bolt"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
          </g>

          {/* The vault wheel — three-spoke handle that spins as it unlocks. */}
          <g className="vlt-spokes">
            <circle cx="100" cy="100" r="46" className="vlt-wheel-ring" />
            {[0, 120, 240].map((deg) => (
              <rect
                key={deg}
                x="95"
                y="38"
                width="10"
                height="36"
                rx="5"
                className="vlt-spoke"
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
            <circle cx="100" cy="100" r="14" className="vlt-wheel-hub" />
          </g>
        </svg>
        <span className="vlt-hub-icon">
          <Lock strokeWidth={2.5} />
        </span>
      </div>

      <div className="vlt-readout">
        <p className="vlt-brand">THE BUNKER</p>
        <p className="vlt-status">
          <span className="vlt-status-dot" />
          {status}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { signOut } from "@/app/(dashboard)/actions";
import { VAULT_TAB_KEY, VAULT_UNLOCK_KEY } from "@/lib/auth/vault";

/**
 * The vault gate — a centered, secure-unlock overlay that sits over the whole
 * dashboard on first paint and does two jobs:
 *
 * 1. **Re-auth on a fresh tab.** sessionStorage is per-tab and dies with the
 *    tab. If the "this tab authenticated" stamp is missing (a reopened tab),
 *    the session is torn down via {@link signOut} and the operator is bounced
 *    back to the login screen — you re-authenticate every time you reopen it.
 *
 * 2. **The unlock sequence.** Straight after a successful sign-in the gate runs
 *    a precise lock-disengage sequence (sweeping progress ring → padlock snaps
 *    open) and then *pulls the real dashboard into focus* behind it: the page
 *    itself is the reveal, sharpening from a blur as the overlay clears (driven
 *    by the `data-vault` attribute on <html>, see globals.css `.vault-reveal`).
 *    A plain in-tab reload gets a quick veil; reduced-motion gets an instant
 *    reveal.
 *
 * Because the overlay is server-rendered closed it also stops secure content
 * from flashing on a reopened tab before the logout fires.
 */

type Phase = "sealed" | "opening" | "relock" | "open";
type Mode = "full" | "quick";

// Dial tick ring, computed deterministically. Coordinates are rounded so server
// and client agree to the digit — Math.cos/sin differ by ~1e-14 across JS
// engines, which would otherwise trip a hydration mismatch.
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const TICKS = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const major = i % 4 === 0;
  const inner = major ? 76 : 80;
  return {
    x1: round3(100 + c * inner),
    y1: round3(100 + s * inner),
    x2: round3(100 + c * 87),
    y2: round3(100 + s * 87),
    major,
  };
});

const FULL_SEQUENCE: [number, string][] = [
  [0, "Verifying credentials"],
  [650, "Establishing secure channel"],
  [1300, "Decrypting workspace"],
  [1980, "Access granted"],
];

const FULL_TOTAL = 2700;
const FULL_REVEAL = 1980;
const QUICK_TOTAL = 760;
const QUICK_REVEAL = 240;
const REDUCED_TOTAL = 420;

function setReveal(state: string | null) {
  if (typeof document === "undefined") return;
  if (state) document.documentElement.dataset.vault = state;
  else delete document.documentElement.dataset.vault;
}

export function VaultGate() {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [mode, setMode] = useState<Mode>("full");
  const [status, setStatus] = useState("Sealed");

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

    // Keep the page blurred-out behind the overlay from the first frame.
    setReveal("covered");

    // Kick the sequence off the effect body (via rAF) so we never call setState
    // synchronously on mount.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!alive) {
        setMode("full");
        setStatus("Re-authentication required");
        setPhase("relock");
        after(950, () => void signOut());
        after(4000, () => window.location.assign("/login"));
      } else if (reduce) {
        setMode("quick");
        setPhase("opening");
        after(40, () => setReveal("open"));
        after(REDUCED_TOTAL, () => setPhase("open"));
      } else if (unlock) {
        setMode("full");
        setPhase("opening");
        FULL_SEQUENCE.forEach(([t, s]) => after(t, () => setStatus(s)));
        after(FULL_REVEAL, () => setReveal("open"));
        after(FULL_TOTAL, () => setPhase("open"));
      } else {
        // Plain in-tab reload: a quick veil, no full ceremony.
        setMode("quick");
        setPhase("opening");
        after(QUICK_REVEAL, () => setReveal("open"));
        after(QUICK_TOTAL, () => setPhase("open"));
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      setReveal(null);
    };
  }, []);

  if (phase === "open") return null;

  const locked = phase === "relock";

  return (
    <div className="vlt" data-phase={phase} data-mode={mode} role="presentation" aria-hidden>
      <div className="vlt-field" />

      <div className="vlt-stage">
        <div className={locked ? "vlt-emblem vlt-emblem-locked" : "vlt-emblem"}>
          <svg viewBox="0 0 200 200" className="vlt-svg">
            <circle cx="100" cy="100" r="87" className="vlt-track" />
            <g className="vlt-ticks">
              {TICKS.map((t, i) => (
                <line
                  key={i}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  className={t.major ? "vlt-tick vlt-tick-major" : "vlt-tick"}
                />
              ))}
            </g>
            <circle
              cx="100"
              cy="100"
              r="87"
              className="vlt-progress"
              pathLength={100}
              transform="rotate(-90 100 100)"
            />
            <circle cx="100" cy="100" r="58" className="vlt-inner" />
            <g className="vlt-scan">
              <line x1="100" y1="100" x2="100" y2="44" className="vlt-scan-line" />
            </g>
          </svg>

          <span className="vlt-lock vlt-lock-closed">
            <Lock strokeWidth={1.75} />
          </span>
          <span className="vlt-lock vlt-lock-open">
            <LockOpen strokeWidth={1.75} />
          </span>
          <span className="vlt-pulse" />
        </div>

        <div className="vlt-meta">
          <p className="vlt-brand">THE BUNKER</p>
          <div className="vlt-bar">
            <span className="vlt-bar-fill" />
          </div>
          <p className="vlt-status">{status}</p>
        </div>
      </div>
    </div>
  );
}

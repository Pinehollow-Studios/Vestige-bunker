import {
  Flag,
  Goal,
  Leaf,
  type LucideIcon,
  MapPin,
  Mountain,
  Shield,
  Star,
  Trophy,
} from "lucide-react";
import type { CSSProperties } from "react";
import { crestColorHex } from "./types";

/**
 * Crest glyph options — the `token` is the iOS SF Symbol name stored in the
 * `crest` jsonb (so the phone renders the real glyph); the `icon` is the
 * closest lucide equivalent for the admin preview, and `label` is the picker
 * caption. Keep this list in lockstep with `SocietyCrestView.glyphChoices` on
 * iOS.
 */
export const CREST_GLYPHS: { token: string; label: string; icon: LucideIcon }[] = [
  { token: "flag.fill", label: "Flag", icon: Flag },
  { token: "figure.golf", label: "Golfer", icon: Goal },
  { token: "mappin.and.ellipse", label: "Pin", icon: MapPin },
  { token: "trophy.fill", label: "Trophy", icon: Trophy },
  { token: "star.fill", label: "Star", icon: Star },
  { token: "shield.fill", label: "Shield", icon: Shield },
  { token: "leaf.fill", label: "Leaf", icon: Leaf },
  { token: "mountain.2.fill", label: "Mountain", icon: Mountain },
];

/** Renders one crest glyph via a stable component reference per token. */
function GlyphMark({ glyph, style }: { glyph: string | null | undefined; style: CSSProperties }) {
  switch (glyph) {
    case "figure.golf":
      return <Goal style={style} strokeWidth={2.2} />;
    case "mappin.and.ellipse":
      return <MapPin style={style} strokeWidth={2.2} />;
    case "trophy.fill":
      return <Trophy style={style} strokeWidth={2.2} />;
    case "star.fill":
      return <Star style={style} strokeWidth={2.2} />;
    case "shield.fill":
      return <Shield style={style} strokeWidth={2.2} />;
    case "leaf.fill":
      return <Leaf style={style} strokeWidth={2.2} />;
    case "mountain.2.fill":
      return <Mountain style={style} strokeWidth={2.2} />;
    default:
      return <Flag style={style} strokeWidth={2.2} />;
  }
}

/** A native-composed society crest preview — glyph on an Atlas-colour tile. */
export function SocietyCrest({
  glyph,
  color,
  size = 48,
}: {
  glyph: string | null | undefined;
  color: string | null | undefined;
  size?: number;
}) {
  const hex = crestColorHex(color);
  const px = size * 0.44;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-xl"
      style={{
        width: size,
        height: size,
        backgroundColor: `${hex}2E`, // ~18% alpha tile
        boxShadow: `inset 0 0 0 1px ${hex}73`, // ~45% alpha hairline
      }}
    >
      <GlyphMark glyph={glyph} style={{ width: px, height: px, color: hex }} />
    </span>
  );
}

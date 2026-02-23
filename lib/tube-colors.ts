/**
 * Map tube color names to their hex display colors.
 * Tube colors represent the cap color of blood collection tubes.
 */

const TUBE_COLORS: Record<string, string> = {
  // French color names
  lavande: "#a78bfa",   // lavender / violet — EDTA tubes
  violet: "#a78bfa",
  lavender: "#a78bfa",
  rouge: "#ef4444",     // red — dry / no additive
  red: "#ef4444",
  bleu: "#60a5fa",      // light blue — citrate
  blue: "#60a5fa",
  "light blue": "#60a5fa",
  vert: "#4ade80",      // green — heparin
  green: "#4ade80",
  jaune: "#facc15",     // yellow — gel separator / SST
  yellow: "#facc15",
  gold: "#facc15",      // gold — SST / gel separator (same as yellow)
  sst: "#facc15",       // SST tube = gold/yellow
  gris: "#9ca3af",      // gray — fluoride / oxalate
  grey: "#9ca3af",
  gray: "#9ca3af",
  noir: "#475569",      // black — VS / ESR citrate
  black: "#475569",
  urine: "#fbbf24",     // amber — urine container
  pink: "#f472b6",      // pink — blood bank (EDTA)
  rose: "#f472b6",
  "royal blue": "#3b82f6", // royal blue — trace elements
};

const FALLBACK_COLOR = "#6b7280";

/**
 * Resolve a tube type string to a display hex color.
 * Returns null for empty/null input.
 */
export function parseTubeColor(
  tubeType: string | null | undefined
): { color: string; label: string } | null {
  if (!tubeType || !tubeType.trim()) return null;

  const lower = tubeType.toLowerCase().trim();

  // Direct match first (most seed data uses single color words)
  if (TUBE_COLORS[lower]) {
    return { color: TUBE_COLORS[lower], label: tubeType.trim() };
  }

  // Keyword search for longer strings like "Tube EDTA (violet)"
  for (const [keyword, color] of Object.entries(TUBE_COLORS)) {
    if (lower.includes(keyword)) {
      return { color, label: tubeType.trim() };
    }
  }

  return { color: FALLBACK_COLOR, label: tubeType.trim() };
}

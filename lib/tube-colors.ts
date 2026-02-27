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
  "tube or": "#facc15",  // "Tube or (SST)" — gold in French
  sst: "#facc15",       // SST tube = gold/yellow
  gel: "#facc15",       // gel separator tube = gold/yellow (SST)
  gris: "#9ca3af",      // gray — fluoride / oxalate
  grey: "#9ca3af",
  gray: "#9ca3af",
  noir: "#475569",      // black — VS / ESR citrate
  black: "#475569",
  urine: "#fbbf24",     // amber — urine container
  contenant: "#fbbf24", // generic container (urine / stool) — amber
  pink: "#f472b6",      // pink — blood bank (EDTA)
  rose: "#f472b6",
  "royal blue": "#3b82f6", // royal blue — trace elements
  "bleu foncé": "#3b82f6", // royal blue in French
  "écouvillon": "#10b981", // swab — emerald
  thinprep: "#8b5cf6",  // ThinPrep vial — violet
  trousse: "#f59e0b",   // special kit — amber/orange
  "de formaline": "#ef4444",  // formalin container — red
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

  // Keyword search (longest first so specific matches beat generic ones)
  const sorted = Object.entries(TUBE_COLORS).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, color] of sorted) {
    if (lower.includes(keyword)) {
      return { color, label: tubeType.trim() };
    }
  }

  return { color: FALLBACK_COLOR, label: tubeType.trim() };
}

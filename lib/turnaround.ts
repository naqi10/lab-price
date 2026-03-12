export type TurnaroundUnit = "hours" | "days";

export interface TurnaroundParts {
  value: number;
  unit: TurnaroundUnit;
}

export function parseTurnaroundParts(raw: string | null | undefined): TurnaroundParts | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (!s) return null;

  if (s.includes("same day") || s.includes("meme jour") || s.includes("même jour") || s === "j0") {
    return { value: 0, unit: "hours" };
  }

  const match = s.match(/(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?\s*(h|heure|heures|hour|hours|j|jour|jours|day|days|business)?/i);
  if (!match) return null;

  const numeric = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numeric)) return null;

  const token = (match[2] ?? "").toLowerCase();
  if (token.startsWith("h")) return { value: numeric, unit: "hours" };
  if (token === "j" || token.startsWith("jour") || token.startsWith("day") || token.startsWith("business")) {
    return { value: numeric, unit: "days" };
  }

  // If no explicit unit is provided, default to days for lab turnaround semantics.
  return { value: numeric, unit: "days" };
}

export function parseTurnaroundToHours(raw: string | null | undefined): number {
  const parts = parseTurnaroundParts(raw);
  if (!parts) return Infinity;
  return parts.unit === "hours" ? parts.value : parts.value * 24;
}

export function formatTurnaroundShort(raw: string | null | undefined): string {
  const parts = parseTurnaroundParts(raw);
  if (!parts) return "—";
  return `${parts.value}${parts.unit === "hours" ? "h" : "d"}`;
}

export function buildTurnaroundString(
  valueRaw: string | number | null | undefined,
  unit: TurnaroundUnit
): string | null {
  if (valueRaw == null || valueRaw === "") return null;
  const value = typeof valueRaw === "number" ? valueRaw : Number(String(valueRaw).replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  return `${value} ${unit}`;
}

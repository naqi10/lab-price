"use client";

import { useEffect, useState } from "react";

// 10-color palette tuned for the dark theme
export const LAB_COLOR_PALETTE = [
  { dot: "#60a5fa", text: "#93c5fd", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.25)"  }, // blue
  { dot: "#a78bfa", text: "#c4b5fd", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.25)" }, // violet
  { dot: "#34d399", text: "#6ee7b7", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  }, // emerald
  { dot: "#fbbf24", text: "#fcd34d", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  }, // amber
  { dot: "#f87171", text: "#fca5a5", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" }, // red
  { dot: "#38bdf8", text: "#7dd3fc", bg: "rgba(56,189,248,0.10)",  border: "rgba(56,189,248,0.25)"  }, // sky
  { dot: "#fb923c", text: "#fdba74", bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)"  }, // orange
  { dot: "#e879f9", text: "#f0abfc", bg: "rgba(232,121,249,0.10)", border: "rgba(232,121,249,0.25)" }, // fuchsia
  { dot: "#4ade80", text: "#86efac", bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.25)"  }, // green
  { dot: "#f472b6", text: "#f9a8d4", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.25)" }, // pink
];

export type LabColor = (typeof LAB_COLOR_PALETTE)[number];

const FALLBACK: LabColor = {
  dot: "#94a3b8",
  text: "#cbd5e1",
  bg: "rgba(148,163,184,0.10)",
  border: "rgba(148,163,184,0.25)",
};

export function useLabColors() {
  const [colorMap, setColorMap] = useState<Record<string, LabColor>>({});

  useEffect(() => {
    fetch("/api/laboratories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          const map: Record<string, LabColor> = {};
          (d.data as { id: string; name: string }[])
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((lab, i) => {
              map[lab.id] = LAB_COLOR_PALETTE[i % LAB_COLOR_PALETTE.length];
            });
          setColorMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const getColor = (labId: string): LabColor => colorMap[labId] ?? FALLBACK;

  return { colorMap, getColor };
}

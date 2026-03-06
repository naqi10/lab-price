"use client";

import React from "react";
import { parseTubeColor } from "@/lib/tube-colors";

const NEUTRAL_COLOR = "#94a3b8";

export function TubeDot({
  tubeType,
  withTooltip = true,
}: {
  tubeType: string | null | undefined;
  withTooltip?: boolean;
}) {
  const tube = parseTubeColor(tubeType);
  const color = tube?.color ?? NEUTRAL_COLOR;
  const label = tube?.label ?? "Tube non renseigné";

  const dot = (
    <span
      className="inline-flex h-4 w-4 items-center justify-center shrink-0"
      title={withTooltip ? label : undefined}
      aria-label={label}
    >
      <span
        className="inline-block h-2.5 w-2.5 min-h-[10px] min-w-[10px] shrink-0 rounded-full ring-1 ring-black/15"
        style={{ backgroundColor: color }}
      />
    </span>
  );

  return dot;
}


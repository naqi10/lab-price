import { Badge } from "@/components/ui/badge";

const config: Record<
  string,
  { label: string; variant: "info" | "success" | "warning" | "destructive" }
> = {
  MANUAL: { label: "Correspondance manuelle", variant: "info" },
  EXACT: { label: "Correspondance automatique", variant: "success" },
  FUZZY: { label: "Correspondance automatique", variant: "warning" },
  NONE: { label: "Non trouvé", variant: "destructive" },
};

export default function MatchIndicator({
  type,
  confidence,
  compact,
}: {
  type: string;
  confidence?: number;
  /** When true, show short labels (for tight spaces like table cells). */
  compact?: boolean;
}) {
  const { label, variant } = config[type] || config.NONE;

  const shortLabels: Record<string, string> = {
    MANUAL: "Manuel",
    EXACT: "Auto",
    FUZZY: "Auto",
    NONE: "N/D",
  };

  const displayLabel = compact ? (shortLabels[type] || label) : label;

  return (
    <Badge variant={variant} className="text-xs whitespace-nowrap">
      {displayLabel}
      {confidence !== undefined && type !== "MANUAL" && ` ${Math.round(confidence * 100)}%`}
    </Badge>
  );
}

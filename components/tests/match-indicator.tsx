import { Badge } from "@/components/ui/badge";

const config: Record<string, { label: string; variant: "info" | "success" | "warning" | "destructive" }> = {
  MANUAL: { label: "Manuel", variant: "info" }, AUTO_EXACT: { label: "Exact", variant: "success" }, AUTO_FUZZY: { label: "Approx.", variant: "warning" }, NONE: { label: "Aucun", variant: "destructive" },
};

export default function MatchIndicator({ type, confidence }: { type: string; confidence?: number }) {
  const { label, variant } = config[type] || config.NONE;
  return <Badge variant={variant} className="text-xs">{label}{confidence !== undefined && ` ${Math.round(confidence * 100)}%`}</Badge>;
}

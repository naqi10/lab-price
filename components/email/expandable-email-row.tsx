"use client";

import { useState } from "react";
import { ChevronDown, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface EmailLogWithDetails {
  id: string;
  toEmail: string;
  subject: string;
  status: "SENT" | "FAILED";
  error?: string | null;
  source: string;
  createdAt: Date;
  estimate?: {
    testMappingIds: string[];
    selections?: Record<string, string> | null;
    customPrices?: Record<string, number>;
    testMappingDetails?: Array<{
      id: string;
      canonicalName: string;
      prices?: Record<string, number>;
    }>;
  };
}

interface ExpandableEmailRowProps {
  email: EmailLogWithDetails;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  onDownload?: () => Promise<void>;
  onResend?: () => Promise<void>;
  downloadingId?: string | null;
  resendingId?: string | null;
}

export default function ExpandableEmailRow({
  email,
  isExpanded = false,
  onExpandChange,
  onDownload,
  onResend,
  downloadingId,
  resendingId,
}: ExpandableEmailRowProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggleExpand = () => {
    const newState = !expanded;
    setExpanded(newState);
    onExpandChange?.(newState);
  };

  const isDownloading = downloadingId === email.id;
  const isResending = resendingId === email.id;
  
  const testCount = email.estimate?.testMappingIds.length || 0;
  const hasError = email.status === "FAILED";

  return (
    <>
      {/* Main Row */}
      <div className="border-b hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 p-4">
          {/* Expand Button */}
          <button
            onClick={handleToggleExpand}
            className="p-1 hover:bg-muted rounded transition-colors"
            aria-expanded={expanded}
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-sm">{email.toEmail}</p>
              {hasError && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {email.subject}
            </p>
            {hasError && email.error && (
              <p className="text-xs text-red-600 mt-1">{email.error}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {testCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {testCount} test{testCount !== 1 ? "s" : ""}
              </Badge>
            )}
            <span>
              {new Date(email.createdAt).toLocaleDateString("fr-FR")}
            </span>
            <Badge 
              variant={hasError ? "destructive" : "default"}
              className="text-xs"
            >
              {hasError ? "Erreur" : "Envoyé"}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                disabled={isDownloading}
                className="h-8 w-8 p-0"
                title="Télécharger le PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onResend && !hasError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResend}
                disabled={isResending}
                className="h-8 px-3 text-xs"
              >
                {isResending ? "Envoi..." : "Renvoyer"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && email.estimate && (
        <div className="bg-muted/20 border-b p-4 space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Tests inclus:</h4>
            <div className="space-y-2">
               {email.estimate.testMappingDetails?.map((test) => {
                 const selectedLabId = email.estimate?.selections?.[test.id];
                 const labName = selectedLabId
                   ? `Lab-${selectedLabId.substring(0, 4)}`
                   : "—";
                 const customPrice = email.estimate?.customPrices?.[`${test.id}-${selectedLabId}`];
                 const basePrice = selectedLabId && test.prices ? (test.prices as Record<string, number>)[selectedLabId] || 0 : 0;
                 const displayPrice = customPrice || basePrice;

                return (
                  <div
                    key={test.id}
                    className="flex items-center justify-between text-sm p-2 bg-background rounded"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{test.canonicalName}</p>
                      <p className="text-xs text-muted-foreground">{labName}</p>
                    </div>
                    <div className="text-right">
                      {customPrice && (
                        <p className="text-xs line-through text-muted-foreground">
                          {formatCurrency(basePrice)}
                        </p>
                      )}
                      <p className="font-medium">
                        {formatCurrency(displayPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

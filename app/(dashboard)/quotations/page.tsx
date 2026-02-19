"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/header";
import QuotationHistoryTable from "@/components/quotations/quotation-history-table";
import EmailDialog from "@/components/quotations/email-dialog";
import { useQuotations } from "@/hooks/use-quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, X } from "lucide-react";

export default function QuotationsPage() {
  const router = useRouter();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = useMemo(
    () => ({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [dateFrom, dateTo]
  );

  const { quotations, isLoading, error, refetch } = useQuotations(filters);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  const handleSendEmail = (id: string) => {
    setSelectedQuotationId(id);
    setEmailDialogOpen(true);
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setSelectedQuotationId(null);
    refetch();
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <>
      <Header title="Devis" />

      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Du
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40 h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Au
            </Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40 h-9 text-sm"
            />
          </div>
          {hasDateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
        <Button onClick={() => router.push("/quotations/new")}>
          Nouveau devis
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="mt-6">
        <QuotationHistoryTable
          quotations={quotations}
          onSendEmail={handleSendEmail}
          onResendEmail={handleSendEmail}
        />
      </div>

      {selectedQuotationId && (
        <EmailDialog
          open={emailDialogOpen}
          quotationId={selectedQuotationId}
          onClose={handleEmailDialogClose}
        />
      )}
    </>
  );
}

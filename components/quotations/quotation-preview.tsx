"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

export interface QuotationPreviewData {
  quotationNumber: string;
  title: string;
  status: string;
  createdAt: string | Date;
  validUntil: string | Date;
  customerId?: string | null;
  customer?: { id: string; name: string; email: string; company?: string | null } | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientReference?: string | null;
  notes?: string | null;
  subtotal?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalPrice: number;
  laboratory: {
    name: string;
    code?: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  items: Array<{
    position: number;
    testName: string;
    testCode?: string | null;
    labTestName?: string;
    price: number;
  }>;
  createdBy?: { name: string; email: string };
}

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CANCELLED: "Annulé",
};

export default function QuotationPreview({
  quotation,
}: {
  quotation: QuotationPreviewData;
}) {
  const subtotal = quotation.subtotal ?? quotation.items.reduce((s, i) => s + i.price, 0);
  const taxRate = quotation.taxRate ?? 0;
  const taxAmount = quotation.taxAmount ?? 0;
  const validUntil =
    typeof quotation.validUntil === "string"
      ? quotation.validUntil
      : quotation.validUntil;
  const createdAt =
    typeof quotation.createdAt === "string"
      ? quotation.createdAt
      : quotation.createdAt;

  return (
    <div className="space-y-6 print:text-black max-w-4xl">
      {/* Company branding header (matches PDF) */}
      <div className="flex items-center justify-between border-b pb-4">
        <div
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded font-semibold text-sm"
          aria-label="Lab Price Comparator"
        >
          Lab Price Comparator
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">DEVIS</h1>
          <p className="text-sm text-muted-foreground">
            N° {quotation.quotationNumber}
          </p>
          <p className="text-sm text-muted-foreground">
            Date : {formatDate(createdAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            Valide jusqu'au : {formatDate(validUntil)}
          </p>
          <Badge
            variant={quotation.status === "DRAFT" ? "secondary" : "default"}
            className="mt-2"
          >
            {statusLabels[quotation.status] ?? quotation.status}
          </Badge>
        </div>
      </div>

      {/* Lab info (left) / Customer info (right) */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-semibold text-[#1e3a5f] mb-2 text-base">Laboratoire</h2>
          <p className="text-sm font-medium">{quotation.laboratory.name}</p>
          {quotation.laboratory.address && (
            <p className="text-sm text-muted-foreground">
              {quotation.laboratory.address}
            </p>
          )}
          {quotation.laboratory.city && (
            <p className="text-sm text-muted-foreground">
              {quotation.laboratory.city}
            </p>
          )}
          {quotation.laboratory.phone && (
            <p className="text-sm text-muted-foreground">
              Tél : {quotation.laboratory.phone}
            </p>
          )}
          {quotation.laboratory.email && (
            <p className="text-sm text-muted-foreground">
              {quotation.laboratory.email}
            </p>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-[#1e3a5f] mb-2 text-base">Client</h2>
          {(() => {
            const name = quotation.customer?.name || quotation.clientName;
            const email = quotation.customer?.email || quotation.clientEmail;
            const company = quotation.customer?.company;
            return (
              <>
                {name ? (
                  <p className="text-sm">{name}</p>
                ) : null}
                {email ? (
                  <p className="text-sm text-muted-foreground">{email}</p>
                ) : null}
                {company ? (
                  <p className="text-sm text-muted-foreground">{company}</p>
                ) : null}
                {!name && !email && (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </>
            );
          })()}
          {quotation.clientReference && (
            <p className="text-sm text-muted-foreground mt-1">
              Réf. client : {quotation.clientReference}
            </p>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="text-center text-lg font-semibold">{quotation.title}</h2>

      {/* Items table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">N°</TableHead>
            <TableHead>Analyse</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Prix (MAD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotation.items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.position}</TableCell>
              <TableCell>{item.testName}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.testCode ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.price)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="font-medium">
              Sous-total :
            </TableCell>
            <TableCell />
            <TableCell className="text-right font-medium">
              {formatCurrency(subtotal)}
            </TableCell>
          </TableRow>
          {taxRate > 0 && (
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                TVA ({taxRate} %) :
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-medium">
                {formatCurrency(taxAmount)}
              </TableCell>
            </TableRow>
          )}
          <TableRow>
            <TableCell colSpan={2} className="font-bold">
              Total TTC :
            </TableCell>
            <TableCell />
            <TableCell className="text-right font-bold">
              {formatCurrency(quotation.totalPrice)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Notes */}
      {quotation.notes && (
        <div>
          <h2 className="font-semibold mb-1 text-base">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {quotation.notes}
          </p>
        </div>
      )}

      {/* Terms & conditions + footer (matches PDF) */}
      <div className="border-t pt-6 mt-8 space-y-2 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Conditions</p>
        <p>
          Ce devis est valable jusqu'au {formatDate(validUntil)}.
        </p>
        <p>Les prix sont exprimés en Dirhams Marocains (MAD).</p>
        <p>Conditions de paiement : à réception de facture.</p>
        <div className="pt-4">
          <p className="font-semibold text-[#1e3a5f]">Lab Price Comparator</p>
          <p>Email : contact@labprice.com  •  www.labprice.com</p>
          {quotation.createdBy && (
            <p className="mt-2 text-xs">
              Généré le {formatDate(new Date())} par {quotation.createdBy.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

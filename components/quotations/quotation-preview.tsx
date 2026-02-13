import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export default function QuotationPreview({ quotation }: { quotation: { quotationNumber: string; clientName: string; clientEmail: string; clientCompany?: string; laboratoryName: string; totalAmount: number; status: string; createdAt: string; notes?: string; items: { testName: string; price: number; quantity: number; subtotal: number }[] } }) {
  return (
    <div className="space-y-6 print:text-black">
      <div className="flex justify-between items-start"><div><h2 className="text-2xl font-bold">Devis {quotation.quotationNumber}</h2><p className="text-sm text-muted-foreground">{formatDate(new Date(quotation.createdAt))}</p></div><Badge variant={quotation.status === "DRAFT" ? "secondary" : "success"}>{quotation.status === "DRAFT" ? "Brouillon" : quotation.status === "SENT" ? "Envoyé" : "Renvoyé"}</Badge></div>
      <div className="grid gap-4 md:grid-cols-2"><div><h3 className="font-semibold mb-1">Client</h3><p className="text-sm">{quotation.clientName}</p><p className="text-sm text-muted-foreground">{quotation.clientEmail}</p>{quotation.clientCompany && <p className="text-sm text-muted-foreground">{quotation.clientCompany}</p>}</div><div><h3 className="font-semibold mb-1">Laboratoire</h3><p className="text-sm">{quotation.laboratoryName}</p></div></div>
      <Table><TableHeader><TableRow><TableHead>Test</TableHead><TableHead className="text-right">Prix unitaire</TableHead><TableHead className="text-right">Qté</TableHead><TableHead className="text-right">Sous-total</TableHead></TableRow></TableHeader><TableBody>{quotation.items.map((item, i) => <TableRow key={i}><TableCell>{item.testName}</TableCell><TableCell className="text-right">{formatCurrency(item.price)}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell></TableRow>)}</TableBody><TableFooter><TableRow><TableCell colSpan={3} className="font-bold text-right">Total</TableCell><TableCell className="text-right font-bold">{formatCurrency(quotation.totalAmount)}</TableCell></TableRow></TableFooter></Table>
      {quotation.notes && <div><h3 className="font-semibold mb-1">Notes</h3><p className="text-sm text-muted-foreground">{quotation.notes}</p></div>}
    </div>
  );
}

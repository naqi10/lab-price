"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PriceListPreview({ open, onClose, onConfirm, data, isLoading }: { open: boolean; onClose: () => void; onConfirm: () => void; data: { headers: string[]; rows: string[][]; totalRows: number } | null; isLoading?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader><DialogTitle>Aperçu de la liste de prix</DialogTitle></DialogHeader>
        {data && <>
          <p className="text-sm text-muted-foreground">{data.totalRows} tests trouvés</p>
          <div className="max-h-[50vh] overflow-auto"><Table><TableHeader><TableRow>{data.headers.map((h, i) => <TableHead key={i}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{data.rows.slice(0, 20).map((row, i) => <TableRow key={i}>{row.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></div>
          {data.rows.length > 20 && <p className="text-sm text-muted-foreground text-center">... et {data.totalRows - 20} autres lignes</p>}
        </>}
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={onConfirm} disabled={isLoading}>{isLoading ? "Importation..." : "Confirmer l'importation"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface SaveEstimateDialogProps {
   open: boolean;
   onClose: () => void;
   testMappingIds: string[];
   selections?: Record<string, string>;
   customPrices?: Record<string, number>;
   totalPrice: number;
   selectionMode?: "CHEAPEST" | "FASTEST" | "CUSTOM";  // The mode of selection
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

export default function SaveEstimateDialog({
   open,
   onClose,
   testMappingIds,
   selections,
   customPrices = {},
   totalPrice,
   selectionMode = "CUSTOM",
}: SaveEstimateDialogProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState("30");
  const [isSaving, setIsSaving] = useState(false);
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Load customers on dialog open
  useEffect(() => {
    if (open) {
      setLoadingCustomers(true);
      fetch("/api/customers?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCustomers(data.data.customers || []);
          }
        })
        .finally(() => setLoadingCustomers(false));
    }
  }, [open]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

   const handleSave = async () => {
     setIsSaving(true);
     try {
       const validUntil = new Date();
       validUntil.setDate(validUntil.getDate() + parseInt(validDays));

       const res = await fetch("/api/estimates", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           testMappingIds,
           selections: selections || null,
           customPrices,
           totalPrice,
           customerId: selectedCustomer?.id || null,
           notes: notes || null,
           validUntil: validUntil.toISOString(),
           selectionMode: selections && Object.keys(selections).length > 0 ? selectionMode : null,
         }),
       });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erreur lors de la sauvegarde");
      }

      const data = await res.json();
      alert(`Estimation ${data.data.estimateNumber} créée avec succès`);
      setSelectedCustomer(null);
      setNotes("");
      setValidDays("30");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer l'estimation</DialogTitle>
          <DialogDescription>
            Sauvegardez cette comparaison de prix comme estimation pour une traçabilité complète
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estimate Summary */}
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Tests sélectionnés</p>
                <p className="font-medium">{testMappingIds.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Prix total</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("fr-MA", {
                    style: "currency",
                    currency: "MAD",
                  }).format(totalPrice)}
                </p>
              </div>
               {selections && Object.keys(selections).length > 0 && (
                 <div className="col-span-2">
                   <p className="text-muted-foreground text-xs">Mode</p>
                   <p className="font-medium text-xs">
                     {selectionMode === "CHEAPEST" && "Sélection optimisée par prix"}
                     {selectionMode === "FASTEST" && "Sélection optimisée par délai"}
                     {selectionMode === "CUSTOM" && "Sélection personnalisée"}
                   </p>
                 </div>
               )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Client (optionnel)</label>
            <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between",
                    selectedCustomer && "border-blue-200 bg-blue-50"
                  )}
                  disabled={loadingCustomers}
                >
                  <span className={selectedCustomer ? "text-foreground" : "text-muted-foreground"}>
                    {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.email})` : "Choisir un client..."}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher un client..."
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Aucun client trouvé</CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id}
                          onSelect={() => {
                            setSelectedCustomer(customer);
                            setOpenCustomerPopover(false);
                            setCustomerSearch("");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Validity Period */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Validité (jours)</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {validDays} jours
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
                <div className="space-y-1">
                  {["7", "14", "30", "60", "90"].map((days) => (
                    <Button
                      key={days}
                      variant={validDays === days ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setValidDays(days);
                      }}
                    >
                      {days} jours
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <Textarea
              placeholder="Ajoutez des notes ou conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24 resize-none"
            />
          </div>

          {/* Warning about custom prices */}
          {Object.keys(customPrices).length > 0 && (
            <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Prix personnalisés sauvegardés</p>
                <p className="mt-1">
                  Cette estimation inclut {Object.keys(customPrices).length} prix personnalisés modifiés en session.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

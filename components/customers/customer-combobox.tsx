"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Check, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

interface CustomerComboboxProps {
  onSelect: (customer: CustomerOption | null) => void;
  selectedCustomer: CustomerOption | null;
}

export default function CustomerCombobox({ onSelect, selectedCustomer }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState([] as CustomerOption[]);
  const [loading, setLoading] = useState(false);

  // Create new customer inline
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/customers/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setResults(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelect = (customer: CustomerOption) => {
    onSelect(customer);
    setOpen(false);
    setQuery("");
    setShowCreate(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
  };

  const handleCreateNew = async () => {
    if (!newName || !newEmail) {
      setCreateError("Le nom et l'email sont requis");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      const data = await res.json();
      if (data.success) {
        handleSelect({ id: data.data.id, name: data.data.name, email: data.data.email });
        setShowCreate(false);
        setNewName("");
        setNewEmail("");
      } else {
        setCreateError(data.message);
      }
    } catch {
      setCreateError("Erreur de connexion");
    } finally {
      setCreating(false);
    }
  };

  const renderCustomerItems = () => {
    return results.map((c: { id: string; name: string; email: string }) => {
      const isSelected = selectedCustomer?.id === c.id;
      return (
        <CommandItem
          key={c.id}
          value={c.id}
          onSelect={() => handleSelect(c)}
        >
          <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
          </div>
        </CommandItem>
      );
    });
  };

   if (selectedCustomer) {
     return (
       <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 transition-colors hover:bg-primary/10">
         <div className="flex-1 min-w-0">
           <p className="text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
         </div>
         <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0 h-6 w-6 p-0 hover:bg-destructive/10">
           <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
         </Button>
       </div>
     );
   }

   return (
     <div className="space-y-2">
       <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
           <Button
             variant="outline"
             role="combobox"
             className="w-full justify-between font-normal"
           >
             <span className="text-muted-foreground truncate">Sélectionnez un client...</span>
             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
           </Button>
         </PopoverTrigger>
         <PopoverContent className="p-0 w-96">
           <Command shouldFilter={false}>
             <CommandInput
               placeholder="Rechercher par nom ou email..."
               value={query}
               onValueChange={setQuery}
             />
             <CommandList>
               {loading && (
                 <div className="py-4 text-center text-sm text-muted-foreground">Recherche...</div>
               )}
               {!loading && results.length === 0 && query.length > 0 && (
                 <CommandEmpty>Aucun client trouvé</CommandEmpty>
               )}
               {!loading && results.length > 0 && (
                 <CommandGroup>
                   {renderCustomerItems()}
                 </CommandGroup>
               )}
               <div className="border-t p-1">
                 <CommandItem
                   onSelect={() => {
                     setShowCreate(true);
                     setOpen(false);
                   }}
                 >
                   <UserPlus className="mr-2 h-4 w-4" />
                   Créer un nouveau client
                 </CommandItem>
               </div>
             </CommandList>
           </Command>
         </PopoverContent>
       </Popover>

      {showCreate && (
        <div className="rounded-md border p-3 space-y-3 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">Nouveau client</p>
          {createError && <p className="text-xs text-red-500">{createError}</p>}
          <div className="space-y-1">
            <Label className="text-xs">Nom *</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du client"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="client@example.com"
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="h-7 text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNew}
              disabled={creating}
              className="h-7 text-xs"
            >
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

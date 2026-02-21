"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Mail, Loader2, CheckCircle2, AlertTriangle, Zap, Search, UserPlus, Check } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

interface EmailComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  testMappingIds: string[];
  testNames: string[];
  /** Per-test lab selections (testMappingId → labId). When provided, sends as multi-lab selection. */
  selections?: Record<string, string>;
  /** Lab lookup for display in multi-lab mode */
  laboratories?: { id: string; name: string }[];
  /** Custom prices (key format: "${testId}-${labId}") */
  customPrices?: Record<string, number>;
}

export default function EmailComparisonDialog({
  open,
  onClose,
  testMappingIds,
  testNames,
  selections,
  laboratories,
  customPrices,
}: EmailComparisonDialogProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    cheapestLab?: string;
    totalPrice?: string;
    isMultiLab?: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  // Search state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [searchResults, setSearchResults] = useState<CustomerOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Create new customer state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const hasSelections = selections && Object.keys(selections).length > 0;

  // Search effect
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/customers/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSearchResults(d.data);
      })
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  const handleSelectCustomer = (customer: CustomerOption) => {
    setSelectedCustomer(customer);
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
        const newCustomer = { id: data.data.id, name: data.data.name, email: data.data.email };
        handleSelectCustomer(newCustomer);
        setNewName("");
        setNewEmail("");
        setCreateError(null);
        setActiveTab("search");
      } else {
        setCreateError(data.message);
      }
    } catch {
      setCreateError("Erreur de connexion");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedCustomer || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/comparison/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMappingIds,
          clientEmail: selectedCustomer.email,
          clientName: selectedCustomer.name,
          customerId: selectedCustomer.id,
          selections: hasSelections ? selections : undefined,
          customPrices: customPrices && Object.keys(customPrices).length > 0 ? customPrices : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const ml = data.data?.multiLabSelection;
        setResult({
          success: true,
          message: data.message,
          cheapestLab: ml
            ? ml.laboratories.map((l: { name: string }) => l.name).join(", ")
            : data.data?.cheapestLaboratory?.name,
          totalPrice: ml
            ? ml.formattedTotalPrice
            : data.data?.cheapestLaboratory?.formattedTotalPrice,
          isMultiLab: !!ml,
        });
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch {
      setResult({ success: false, message: "Erreur de connexion au serveur" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedCustomer(null);
    setQuery("");
    setNewName("");
    setNewEmail("");
    setCreateError(null);
    setActiveTab("search");
    onClose();
  };

  const isValid = testMappingIds.length > 0 && selectedCustomer !== null;
  const labNameMap = new Map(laboratories?.map((l) => [l.id, l.name]) ?? []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer la comparaison par email
          </DialogTitle>
          <DialogDescription>
            {hasSelections
              ? "Envoie la sélection optimisée multi-laboratoires au client."
              : "Compare les prix et envoie automatiquement le meilleur tarif au client."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-3">
            {result.success ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-green-400 font-medium">{result.message}</p>
                {result.cheapestLab && (
                  <div className={`${result.isMultiLab ? "bg-blue-900/20 border-blue-800" : "bg-green-900/20 border-green-800"} border rounded-lg p-4 mt-4 text-left`}>
                    <p className={`text-sm ${result.isMultiLab ? "text-blue-300" : "text-green-300"}`}>
                      <span className="font-semibold">
                        {result.isMultiLab ? "Laboratoires :" : "Laboratoire recommandé :"}
                      </span>{" "}
                      {result.cheapestLab}
                    </p>
                    <p className={`text-sm mt-1 ${result.isMultiLab ? "text-blue-300" : "text-green-300"}`}>
                      <span className="font-semibold">Prix total :</span>{" "}
                      {result.totalPrice}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-red-400 font-medium">{result.message}</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Section */}
            <div className="space-y-3">
              {hasSelections && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <p className="text-xs font-semibold text-blue-400">Sélection optimisée</p>
                  </div>
                  {testNames.map((name, i) => {
                    const labId = selections![testMappingIds[i]];
                    const labName = labId ? labNameMap.get(labId) : undefined;
                    return (
                      <div key={i} className="flex items-center justify-between text-sm py-0.5">
                        <span className="font-medium">{name}</span>
                        {labName && <Badge variant="outline" className="text-xs">{labName}</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}

              {!hasSelections && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Tests sélectionnés</p>
                  <div className="grid grid-cols-2 gap-2">
                    {testNames.map((name, i) => (
                      <p key={i} className="text-xs font-medium text-foreground">
                        {i + 1}. {name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Customer Display */}
            {selectedCustomer && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <Check className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-7 px-2 text-xs"
                >
                  Changer
                </Button>
              </div>
            )}

            {/* Customer Selection Tabs */}
            {!selectedCustomer && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Rechercher
                  </TabsTrigger>
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nouveau client
                  </TabsTrigger>
                </TabsList>

                {/* Search Tab */}
                <TabsContent value="search" className="space-y-3 mt-4 relative z-50">
                  <div className="space-y-2">
                    <Label>Rechercher un client</Label>
                    <div className="relative">
                      <Command shouldFilter={false} className="border rounded-lg overflow-visible">
                        <CommandInput
                          placeholder="Nom ou email..."
                          value={query}
                          onValueChange={setQuery}
                          className="text-sm"
                        />
                        {(searchLoading || searchResults.length > 0 || (query.length === 0)) && (
                          <CommandList className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-popover max-h-48 overflow-y-auto z-50">
                            {searchLoading && (
                              <div className="py-4 text-center text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              </div>
                            )}
                            {!searchLoading && searchResults.length === 0 && query.length > 0 && (
                              <CommandEmpty>Aucun client trouvé</CommandEmpty>
                            )}
                            {!searchLoading && query.length === 0 && (
                              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                Commencez à taper pour rechercher...
                              </CommandEmpty>
                            )}
                            {!searchLoading && searchResults.length > 0 && (
                              <CommandGroup>
                                {searchResults.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.id}
                                    onSelect={() => handleSelectCustomer(customer)}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{customer.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        )}
                      </Command>
                    </div>
                  </div>
                </TabsContent>

                {/* Create New Customer Tab */}
                <TabsContent value="create" className="space-y-3 mt-4">
                  <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    {createError && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                        <p className="text-sm text-red-400">{createError}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="new-name" className="text-sm">
                        Nom du client *
                      </Label>
                      <Input
                        id="new-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Jean Dupont"
                        className="text-sm"
                        disabled={creating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-email" className="text-sm">
                        Email *
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="jean@example.com"
                        className="text-sm"
                        disabled={creating}
                      />
                    </div>

                    <Button
                      onClick={handleCreateNew}
                      disabled={creating || !newName || !newEmail}
                      className="w-full"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Création en cours...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Créer et continuer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Fermer" : "Annuler"}
          </Button>
          {!result && (
            <Button onClick={handleSend} disabled={isLoading || !isValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>{hasSelections ? "Envoyer la sélection" : "Comparer & Envoyer"}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

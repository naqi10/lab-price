"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast { id: string; title?: string; description?: string; variant?: "default" | "destructive" | "success"; }
interface ToastContextValue { toasts: Toast[]; addToast: (toast: Omit<Toast, "id">) => void; removeToast: (id: string) => void; }
const ToastContext = React.createContext<ToastContextValue>({ toasts: [], addToast: () => {}, removeToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={cn(
            "flex items-center gap-3 rounded-lg border p-4 shadow-lg min-w-[300px]",
            toast.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
            toast.variant === "success" && "border-green-800 bg-green-900/40 text-green-400",
            (!toast.variant || toast.variant === "default") && "bg-background"
          )}>
            <div className="flex-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
            </div>
            <button onClick={() => removeToast(toast.id)}><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  return { toast: context.addToast, dismiss: context.removeToast, toasts: context.toasts };
}

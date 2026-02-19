"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Header({ title }: { title: string }) {
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-card/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14">
        <h1 className="text-base font-semibold text-foreground px-6 py-4 flex-1 min-w-0">{title}</h1>
        <div className="px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 hover:bg-accent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent/80"
                aria-label="Menu utilisateur"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 border border-primary/30 flex-shrink-0">
                  <User className="h-2.5 w-2.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:inline">{session?.user?.name || "Admin"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{session?.user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function Header({ title }: { title: string }) {
  const { data: session } = useSession();
  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><button type="button" className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent cursor-pointer" aria-label="Menu utilisateur"><User className="h-4 w-4" /><span className="text-sm">{session?.user?.name || "Admin"}</span></button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="text-sm text-muted-foreground">{session?.user?.email}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}><LogOut className="mr-2 h-4 w-4" />Déconnexion</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

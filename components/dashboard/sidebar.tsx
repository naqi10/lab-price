"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FlaskConical, TestTubes, Contact, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/laboratories", label: "Laboratoires", icon: FlaskConical },
  { href: "/tests", label: "Tests & Correspondances", icon: TestTubes },
  { href: "/customers", label: "Clients", icon: Contact },
  { href: "/quotations", label: "Devis", icon: FileText },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={cn("flex flex-col border-r bg-card transition-all duration-300 h-screen sticky top-0", collapsed ? "w-16" : "w-64")}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h1 className="text-lg font-bold text-primary">Lab Price</h1>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-md hover:bg-accent" aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}>
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

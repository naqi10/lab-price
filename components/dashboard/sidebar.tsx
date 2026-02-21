"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FlaskConical,
  TestTubes,
  Contact,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/tests", label: "Tests & Correspondances", icon: TestTubes },
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/laboratories", label: "Laboratoires", icon: FlaskConical },
  { href: "/customers", label: "Clients", icon: Contact },
  { href: "/estimates", label: "Estimations", icon: FileText },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-primary" : ""
              )}
            />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="fixed top-4 left-4 z-50 flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card shadow-sm md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border/60 bg-card shadow-2xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
            </div>
            <h1 className="text-base font-bold text-foreground">Lab Price</h1>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavLinks onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border/60 bg-card transition-all duration-300 h-screen sticky top-0 shrink-0",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-4 min-h-[60px]">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <FlaskConical className="h-3.5 w-3.5 text-primary" />
              </div>
              <h1 className="text-sm font-bold text-foreground truncate">Lab Price</h1>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-accent transition-colors",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <NavLinks />
        <div className="border-t border-border/40 px-3 py-3">
          <p className={cn("text-xs text-muted-foreground/50 transition-opacity", collapsed ? "opacity-0" : "opacity-100")}>
            v0.1.0
          </p>
        </div>
      </aside>
    </>
  );
}

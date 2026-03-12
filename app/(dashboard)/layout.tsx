"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { DashboardTitleContext } from "@/lib/contexts/dashboard-title";
import { DOMSafetyBoundary } from "@/components/dom-safety-boundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SessionProvider>
      <DashboardTitleContext.Provider value={{ title, setTitle }}>
        <DOMSafetyBoundary>
          <div className="flex h-screen overflow-hidden">
            <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <Header title={title} onMenuOpen={() => setMobileOpen(true)} />
              <main className="flex-1 overflow-y-auto bg-background">
                <div className="w-full px-3 pb-6 sm:px-4 md:px-6 xl:px-8">{children}</div>
              </main>
            </div>
          </div>
        </DOMSafetyBoundary>
      </DashboardTitleContext.Provider>
    </SessionProvider>
  );
}

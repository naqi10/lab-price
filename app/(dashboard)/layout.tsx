"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { DashboardTitleContext } from "@/lib/contexts/dashboard-title";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");

  return (
    <SessionProvider>
      <DashboardTitleContext.Provider value={{ title, setTitle }}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title={title} />
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-7xl px-4 pb-6 md:px-6">{children}</div>
            </main>
          </div>
        </div>
      </DashboardTitleContext.Provider>
    </SessionProvider>
  );
}

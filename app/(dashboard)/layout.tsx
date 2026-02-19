"use client";

import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl px-4 pt-14 pb-6 md:px-6 md:pt-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}

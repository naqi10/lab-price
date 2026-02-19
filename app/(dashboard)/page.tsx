"use client";

import { useState, useEffect } from "react";
import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import QuickActions from "@/components/dashboard/quick-actions";
import StatsCards from "@/components/dashboard/stats-cards";
import EmailStats from "@/components/dashboard/overview-chart";
import PriceListUpdates from "@/components/dashboard/price-list-updates";
import RecentActivity from "@/components/dashboard/recent-activity";
import RecentCustomers from "@/components/dashboard/recent-customers";
import RecentMappings from "@/components/dashboard/recent-mappings";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
   const [data, setData] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   useDashboardTitle("Tableau de bord");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || "Erreur lors du chargement");
        }
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setIsLoading(false));
  }, []);

   return (
     <>
       {isLoading ? (
        <div className="space-y-6 mt-6" role="status" aria-live="polite">
          <span className="sr-only">Chargement du tableau de bord…</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-red-500 mt-6" role="alert">{error}</p>
      ) : data ? (
        <div className="mt-6 space-y-6">
          {/* Quick-action buttons */}
          <QuickActions />

          {/* Stats cards: Labs, Tests, Manual Mappings, Active Users */}
          <StatsCards
            stats={{
              laboratories: data.stats.totalLaboratories,
              tests: data.stats.totalTests,
              mappings: data.stats.totalMappings,
              users: data.stats.totalUsers,
              customers: data.stats.totalCustomers,
            }}
            stalePriceListCount={data.stats.stalePriceListCount}
          />

          {/* Recent customers */}
          <RecentCustomers customers={data.recentCustomers} />

          {/* Email delivery statistics */}
          <EmailStats stats={data.emailStats} />

          {/* Last price list update per laboratory */}
          <PriceListUpdates updates={data.priceListUpdates} />

           {/* Recently created test mappings */}
           <RecentMappings mappings={data.recentMappings} />

           {/* Recent activity log */}
           <RecentActivity activity={data.recentActivity} />
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/header";
import StatsCards from "@/components/dashboard/stats-cards";
import EmailStats from "@/components/dashboard/overview-chart";
import RecentQuotations from "@/components/dashboard/recent-quotations";
import PriceListUpdates from "@/components/dashboard/price-list-updates";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Header title="Tableau de bord" />

      {isLoading ? (
        <div className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : error ? (
        <p className="text-red-500 mt-6">{error}</p>
      ) : data ? (
        <div className="space-y-6">
          {/* Stats cards: Labs, Tests, Manual Mappings, Active Users */}
          <StatsCards
            stats={{
              laboratories: data.stats.totalLaboratories,
              tests: data.stats.totalTests,
              mappings: data.stats.totalMappings,
              users: data.stats.totalUsers,
            }}
          />

          {/* Email delivery statistics */}
          <EmailStats stats={data.emailStats} />

          {/* Last price list update per laboratory */}
          <PriceListUpdates updates={data.priceListUpdates} />

          {/* Recent quotations (last 10) */}
          <RecentQuotations quotations={data.recentQuotations} />

          {/* Recent activity log */}
          <RecentActivity activity={data.recentActivity} />
        </div>
      ) : null}
    </>
  );
}

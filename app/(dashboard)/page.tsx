"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/header";
import StatsCards from "@/components/dashboard/stats-cards";
import OverviewChart from "@/components/dashboard/overview-chart";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/laboratories").then((r) => r.json()),
      fetch("/api/quotations").then((r) => r.json()),
      fetch("/api/tests/mappings").then((r) => r.json()),
    ])
      .then(([labs, quotations, tests]) => {
        setStats({
          totalLaboratories: labs.success ? (labs.data?.length || 0) : 0,
          totalTests: tests.success ? (tests.data?.items?.length || tests.data?.length || 0) : 0,
          totalQuotations: quotations.success ? (quotations.data?.items?.length || quotations.data?.length || 0) : 0,
          recentQuotations: quotations.success ? (quotations.data?.items?.slice(0, 5) || []) : [],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <Header title="Tableau de bord" />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <StatsCards
            stats={{
              laboratories: stats?.totalLaboratories || 0,
              tests: stats?.totalTests || 0,
              quotations: stats?.totalQuotations || 0,
              pending: 0,
            }}
          />
          <div className="mt-6">
            <OverviewChart />
          </div>
        </>
      )}
    </>
  );
}

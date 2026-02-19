"use client";

import { useContext, useEffect } from "react";
import { DashboardTitleContext } from "@/lib/contexts/dashboard-title";

export function useDashboardTitle(title: string) {
  const { setTitle } = useContext(DashboardTitleContext);
  
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}

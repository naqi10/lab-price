"use client";

import { createContext } from "react";

export const DashboardTitleContext = createContext<{
  title: string;
  setTitle: (title: string) => void;
}>({
  title: "Dashboard",
  setTitle: () => {},
});

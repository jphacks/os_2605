"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { AdventurePlan } from "@/types/adventure";
const PlanContext = createContext<{ plan: AdventurePlan | null; setPlan: (plan: AdventurePlan | null) => void } | null>(null);
/** In-memory only, including live data. Reload ends the prepared adventure safely. */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<AdventurePlan | null>(null);
  return <PlanContext.Provider value={{ plan, setPlan }}>{children}</PlanContext.Provider>;
}
export function useAdventurePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("PlanProvider is required");
  return context;
}

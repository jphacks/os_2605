"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { RevealedDestination } from "@/features/adventure/arrival";
import type { PublicAdventurePlan } from "@/types/adventure";

type AdventureState = {
  /** 02 で選んだ片道の所要時間（分）。 */
  minutes: number;
  setMinutes: (minutes: number) => void;
  /** 準備済みの冒険。目的地の名称・座標は含まない。 */
  plan: PublicAdventurePlan | null;
  setPlan: (plan: PublicAdventurePlan | null) => void;
  /** 到着が確認できたときだけ入る、公開された目的地。 */
  revealed: RevealedDestination | null;
  setRevealed: (destination: RevealedDestination | null) => void;
};

const AdventureContext = createContext<AdventureState | null>(null);

/** In-memory only, including live data. Reload ends the prepared adventure safely. */
export function PlanProvider({ children }: { children: ReactNode }) {
  const [minutes, setMinutes] = useState(90);
  const [plan, setPlan] = useState<PublicAdventurePlan | null>(null);
  const [revealed, setRevealed] = useState<RevealedDestination | null>(null);
  return (
    <AdventureContext.Provider value={{ minutes, setMinutes, plan, setPlan, revealed, setRevealed }}>
      {children}
    </AdventureContext.Provider>
  );
}

export function useAdventure() {
  const context = useContext(AdventureContext);
  if (!context) throw new Error("PlanProvider is required");
  return context;
}

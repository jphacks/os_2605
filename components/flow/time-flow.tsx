"use client";
import { TimeScreen } from "@/components/screens/time-screen";
import { useAdventure } from "@/components/adventure/plan-context";

export function TimeFlow() {
  const { minutes, setMinutes } = useAdventure();
  return (
    <TimeScreen minutes={minutes} onChange={setMinutes} startHref="/search" />
  );
}

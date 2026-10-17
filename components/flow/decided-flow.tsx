"use client";
import { useAdventure } from "@/components/adventure/plan-context";
import { DecidedScreen } from "@/components/screens/decided-screen";
import { MessageScreen } from "@/components/screens/message-screen";

export function DecidedFlow() {
  const { plan } = useAdventure();
  if (!plan) {
    return (
      <MessageScreen
        title="冒険がまだ準備されていません"
        primary={{ label: "時間を決める", href: "/setup" }}
      >
        時間を決めて、目的地を探してください。
      </MessageScreen>
    );
  }
  return <DecidedScreen minutes={Math.round(plan.estimatedDurationMinutes)} />;
}

"use client";
import { useAdventure } from "@/components/adventure/plan-context";
import { ArrivedScreen } from "@/components/screens/arrived-screen";
import { MessageScreen } from "@/components/screens/message-screen";

export function ArrivedFlow() {
  const { revealed } = useAdventure();
  if (!revealed) {
    return (
      <MessageScreen
        title="冒険が完了していません"
        primary={{ label: "時間を決める", href: "/setup" }}
      >
        この画面は、到着を確認した冒険からのみ表示できます。中断後や再読み込み後は復元できません。
      </MessageScreen>
    );
  }
  return <ArrivedScreen genre={revealed.category} name={revealed.name} />;
}

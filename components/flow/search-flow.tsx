"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdventure } from "@/components/adventure/plan-context";
import { MessageScreen } from "@/components/screens/message-screen";
import { SearchingScreen } from "@/components/screens/searching-screen";
import { searchAdventure, type SearchResult } from "@/features/adventure/client";

/** 03 検索中。時間は同じまま、ジャンルと目的地をサーバーが引き直す（「もう一度」もここへ来る）。 */
export function SearchFlow() {
  const { minutes, setPlan, setRevealed } = useAdventure();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  // 開発時の二重実行でも、同じ試行では検索を1回しか行わない。
  const inFlight = useRef<{ attempt: number; promise: Promise<SearchResult> } | null>(null);

  useEffect(() => {
    let alive = true;
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    if (inFlight.current?.attempt !== attempt) {
      inFlight.current = { attempt, promise: searchAdventure(minutes) };
    }
    void inFlight.current.promise.then((result) => {
      if (!alive) return;
      if (result.ok) {
        setRevealed(null);
        setPlan(result.plan);
        setFinishing(true);
        const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600;
        completionTimer = setTimeout(() => router.replace("/decided"), delay);
      } else {
        setError(result.message);
      }
    });
    return () => {
      alive = false;
      clearTimeout(completionTimer);
    };
  }, [attempt, minutes, router, setPlan, setRevealed]);

  if (error) {
    return (
      <MessageScreen
        title="目的地を決められませんでした"
        primary={{
          label: "もう一度",
          onClick: () => {
            setError(null);
            setAttempt((n) => n + 1);
          },
        }}
        secondary={{ label: "時間を変える", href: "/setup" }}
      >
        {error}
      </MessageScreen>
    );
  }
  return <SearchingScreen finishing={finishing} />;
}

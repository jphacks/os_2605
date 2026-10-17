"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DEFAULT_DEMO_ORIGIN_ID, findDemoOrigin } from "@/config/origins";
import type { AdventureRequest } from "@/features/adventure/api-types";
import {
  categoryOptions,
  durationOptions,
  vehicleOptions,
} from "@/features/adventure/setup-options";
import {
  errorMessage,
  isFlowErrorCode,
  isNoMatchError,
  type FlowErrorCode,
} from "@/features/adventure/messages";
import {
  PLAN_STORAGE_KEY,
  SETUP_STORAGE_KEY,
  parseStoredPlan,
  parseStoredSetup,
  readRaw,
  removeItem,
  savePlan,
} from "@/features/adventure/storage";
import type { SetupSelection } from "@/features/adventure/validation";
import type { AdventurePlan } from "@/types/adventure";

type Run =
  | { phase: "generating" }
  | { phase: "ready"; plan: AdventurePlan }
  | { phase: "error"; code: FlowErrorCode };

const subscribe = () => () => {};

/** sessionStorageの内容。サーバー描画中・ハイドレーション中はundefined。 */
function useStored(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => undefined,
  );
}

function labelOf<T extends string | number>(
  options: readonly { value: T; label: string }[],
  value: T,
) {
  return options.find((o) => o.value === value)?.label ?? String(value);
}

function Summary({ selection }: { selection: SetupSelection }) {
  return (
    <section
      aria-label="選んだ条件"
      className="rounded-2xl border border-[#cbd4ba] bg-white p-5"
    >
      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[#546757]">乗り物</dt>
          <dd className="font-bold">
            {labelOf(vehicleOptions, selection.vehicleType)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#546757]">片道時間</dt>
          <dd className="font-bold">
            {labelOf(durationOptions, selection.durationMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#546757]">ジャンル</dt>
          <dd className="font-bold">
            {labelOf(categoryOptions, selection.category)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function SetupLink({ children }: { children: string }) {
  return (
    <Link
      href="/setup"
      className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#234e3e] px-6 py-3 font-bold text-[#234e3e]"
    >
      {children}
    </Link>
  );
}

export function DestinationFlow() {
  const setupRaw = useStored(SETUP_STORAGE_KEY);
  const planRaw = useStored(PLAN_STORAGE_KEY);
  const [run, setRun] = useState<Run | null>(null);
  const inFlight = useRef(false);

  const loaded = setupRaw !== undefined && planRaw !== undefined;
  const setup = loaded ? parseStoredSetup(setupRaw) : null;
  const storedPlan = loaded ? parseStoredPlan(planRaw) : null;

  // 不正な保存データは破棄する。
  useEffect(() => {
    if (setup?.status === "invalid") removeItem(SETUP_STORAGE_KEY);
    if (storedPlan?.status === "invalid") removeItem(PLAN_STORAGE_KEY);
  }, [setup?.status, storedPlan?.status]);

  if (!setup || !storedPlan) {
    return <p role="status">読み込み中……</p>;
  }
  if (setup.status === "unavailable") {
    const { title, hint } = errorMessage("STORAGE_UNAVAILABLE");
    return (
      <div role="alert" className="max-w-2xl space-y-4">
        <p className="font-bold">{title}</p>
        <p className="text-sm">{hint}</p>
        <SetupLink>条件を設定する</SetupLink>
      </div>
    );
  }
  if (setup.status !== "ok") {
    return (
      <div role="alert" className="max-w-2xl space-y-4">
        <p className="font-bold">
          {setup.status === "invalid"
            ? "保存された条件が正しくありません"
            : "条件がまだ選ばれていません"}
        </p>
        <p className="text-sm">条件を設定し直してください。</p>
        <SetupLink>条件を設定する</SetupLink>
      </div>
    );
  }

  const selection = setup.value;
  const restored =
    storedPlan.status === "ok" &&
    storedPlan.value.settings.vehicleType === selection.vehicleType &&
    storedPlan.value.settings.durationMinutes === selection.durationMinutes &&
    storedPlan.value.settings.category === selection.category
      ? storedPlan.value
      : null;
  const readyPlan = run?.phase === "ready" ? run.plan : restored;

  async function start() {
    const origin = findDemoOrigin(DEFAULT_DEMO_ORIGIN_ID);
    if (inFlight.current || !origin) return;
    inFlight.current = true;
    setRun({ phase: "generating" });
    const fail = (code: FlowErrorCode) => setRun({ phase: "error", code });
    try {
      const body: AdventureRequest = {
        ...selection,
        originId: origin.id,
        mode: "demo",
      };
      let data: Record<string, unknown> | null = null;
      try {
        const response = await fetch("/api/adventures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        data = await response.json();
      } catch {
        return fail("NETWORK_ERROR");
      }
      if (
        data?.success !== true ||
        typeof data.adventureId !== "string" ||
        typeof data.destinationId !== "string" ||
        typeof data.estimatedDurationMinutes !== "number"
      ) {
        return fail(
          isFlowErrorCode(data?.errorCode) ? data.errorCode : "INVALID_RESPONSE",
        );
      }
      const plan: AdventurePlan = {
        adventureId: data.adventureId,
        settings: { ...selection, origin: origin.location },
        origin,
        destinationId: data.destinationId,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        status: "ready",
        mode: "demo",
      };
      if (!savePlan(plan)) return fail("STORAGE_UNAVAILABLE");
      setRun({ phase: "ready", plan });
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-xs font-bold text-[#667944]">
        デモモード：固定のデモ出発地点を使用しています（GPSは未実装）
      </p>
      <Summary selection={selection} />

      {readyPlan ? (
        <section aria-label="目的地の決定結果" className="space-y-3">
          <h2 className="text-2xl font-bold">🎉 目的地が決まりました！</h2>
          <p>行き先は、まだ秘密です。</p>
          <p className="text-sm text-[#546757]">
            経路の準備は次の開発で実装予定
          </p>
          <button
            type="button"
            disabled
            className="min-h-12 w-full cursor-not-allowed rounded-xl bg-[#d1d9c5] px-5 py-4 font-bold text-[#54614a]"
          >
            冒険を開始する
          </button>
        </section>
      ) : run?.phase === "generating" ? (
        <p role="status" className="font-bold">
          目的地を検索中……
        </p>
      ) : (
        <div className="space-y-4">
          {run?.phase === "error" && (
            <div role="alert" className="space-y-1 rounded-2xl bg-[#f6e3d8] p-4">
              <p className="font-bold">{errorMessage(run.code).title}</p>
              <p className="text-sm">{errorMessage(run.code).hint}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {!(run?.phase === "error" && isNoMatchError(run.code)) && (
              <button
                type="button"
                onClick={start}
                className="min-h-12 rounded-xl bg-[#234e3e] px-6 py-4 font-bold text-white"
              >
                {run?.phase === "error" ? "もう一度探す" : "目的地を探す"}
              </button>
            )}
            {run?.phase === "error" && <SetupLink>条件を変更する</SetupLink>}
          </div>
        </div>
      )}

      {readyPlan && <SetupLink>条件を変更する</SetupLink>}
    </div>
  );
}

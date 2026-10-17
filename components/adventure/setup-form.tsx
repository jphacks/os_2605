"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "@/features/adventure/setup-options";
import { saveSetup } from "@/features/adventure/storage";
import { ChoiceGroup } from "./choice-group";
export function SetupForm() {
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const router = useRouter();
  const canSubmit = vehicle !== null && duration !== null && category !== null;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (vehicle === null || duration === null || category === null) return;
        const saved = saveSetup({
          vehicleType: vehicle,
          durationMinutes: duration,
          category,
        });
        setSaveFailed(!saved);
        if (saved) router.push("/adventure/destination");
      }}
      className="max-w-2xl space-y-8"
    >
      <ChoiceGroup
        legend="01　何で出かける？"
        name="vehicle"
        options={vehicleOptions}
        value={vehicle}
        onChange={setVehicle}
      />
      <ChoiceGroup
        legend="02　どのくらい走る？（片道の目安）"
        name="duration"
        options={durationOptions}
        value={duration}
        onChange={setDuration}
      />
      <ChoiceGroup
        legend="03　どんな場所に出会いたい？"
        name="category"
        options={categoryOptions}
        value={category}
        onChange={setCategory}
      />
      <div className="rounded-2xl bg-[#e7ecd9] p-5">
        <p id="setup-status" className="text-sm leading-7">
          {canSubmit
            ? "条件がそろいました。目的地は到着するまで秘密です。経路の案内は次の開発で実装予定です。"
            : "乗り物・片道時間・ジャンルをすべて選ぶと、目的地を探せます。"}
        </p>
        {saveFailed && (
          <p role="alert" className="mt-2 text-sm font-bold text-[#8a3b12]">
            このブラウザでは条件を保存できませんでした。ストレージの設定を確認してください。
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-describedby="setup-status"
          className="mt-4 min-h-12 w-full rounded-xl bg-[#234e3e] px-5 py-4 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#d1d9c5] disabled:text-[#54614a]"
        >
          目的地を探す
        </button>
      </div>
    </form>
  );
}

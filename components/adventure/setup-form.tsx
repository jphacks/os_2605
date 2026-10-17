"use client";
import { useState } from "react";
import type { Category, DurationMinutes, VehicleType } from "@/types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "@/features/adventure/setup-options";
import { ChoiceGroup } from "./choice-group";
export function SetupForm() {
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);
  const [duration, setDuration] = useState<DurationMinutes | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
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
          条件選択UIのみ利用できます。目的地検索・冒険開始は準備中です。選択内容はこの画面を離れるとリセットされます。
        </p>
        <button
          type="button"
          disabled
          aria-describedby="setup-status"
          className="mt-4 min-h-12 w-full cursor-not-allowed rounded-xl bg-[#d1d9c5] px-5 py-4 font-bold text-[#54614a]"
        >
          冒険開始（準備中）
        </button>
      </div>
    </form>
  );
}

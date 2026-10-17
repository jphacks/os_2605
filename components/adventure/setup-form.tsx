"use client";
import { useEffect, useRef, useState } from "react";
import type { AdventureSetupDraft } from "@/types/adventure";
import {
  vehicleOptions,
  durationOptions,
  categoryOptions,
} from "@/features/adventure/setup-options";
import {
  loadSetupDraft,
  parseSetupDraft,
  saveSetupDraft,
} from "@/features/adventure/setup-storage";
import { ChoiceGroup } from "./choice-group";

type FormDraft = {
  [K in keyof AdventureSetupDraft]: AdventureSetupDraft[K] | null;
};
type FormState = {
  draft: FormDraft;
  phase: "loading" | "editing" | "confirmed";
  message: string;
  error: string;
};
const emptyDraft: FormDraft = {
  vehicleType: null,
  durationMinutes: null,
  category: null,
};
const buttonClass =
  "min-h-12 w-full rounded-xl bg-[#234e3e] px-5 py-4 font-bold text-white enabled:cursor-pointer enabled:hover:bg-[#183c32] disabled:cursor-not-allowed disabled:bg-[#d1d9c5] disabled:text-[#54614a]";

export function SetupForm() {
  const [form, setForm] = useState<FormState>({
    draft: emptyDraft,
    phase: "loading",
    message: "",
    error: "",
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef(form.phase);

  useEffect(() => {
    const saved = loadSetupDraft();
    const message =
      saved.status === "restored"
        ? "保存済みの条件を復元しました。内容を確認して確定してください。"
        : saved.status === "invalid"
          ? "保存データが不正なため読み込めませんでした。条件を選び直してください。"
          : saved.status === "unavailable"
            ? "保存領域を利用できません。条件は選べますが、保存できるまで確定できません。"
            : "";
    // Synchronize once with browser storage after hydration; never read it during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      draft: saved.status === "restored" ? saved.draft : emptyDraft,
      phase: "editing",
      message,
      error: "",
    });
  }, []);

  useEffect(() => {
    if (form.phase === "confirmed" || previousPhase.current === "confirmed")
      headingRef.current?.focus();
    previousPhase.current = form.phase;
  }, [form.phase]);

  function change<K extends keyof AdventureSetupDraft>(
    key: K,
    value: AdventureSetupDraft[K],
  ) {
    setForm((current) => ({
      ...current,
      draft: { ...current.draft, [key]: value },
      error: "",
    }));
  }
  function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.phase !== "editing") return;
    const result = saveSetupDraft(form.draft);
    if (result !== "saved") {
      setForm((current) => ({
        ...current,
        error:
          result === "invalid"
            ? "乗り物・所要時間・ジャンルをすべて選択してください。"
            : "条件を保存できませんでした。ブラウザの保存設定を確認して、もう一度お試しください。入力内容は保持しています。",
      }));
      return;
    }
    setForm((current) => ({
      ...current,
      phase: "confirmed",
      message: "",
      error: "",
    }));
  }

  if (form.phase === "loading")
    return (
      <p role="status" className="py-8 text-sm">
        保存した条件を確認しています…
      </p>
    );

  const confirmed =
    form.phase === "confirmed" ? parseSetupDraft(form.draft) : null;
  if (confirmed) {
    const rows = [
      [
        "乗り物",
        vehicleOptions.find((option) => option.value === confirmed.vehicleType)
          ?.label,
      ],
      ["所要時間", `片道${confirmed.durationMinutes}分`],
      [
        "ジャンル",
        categoryOptions.find((option) => option.value === confirmed.category)
          ?.label,
      ],
    ];
    return (
      <section
        className="max-w-2xl rounded-2xl border border-[#b8c5ac] bg-white p-5 sm:p-8"
        aria-labelledby="setup-summary"
      >
        <h2
          id="setup-summary"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl leading-relaxed font-bold"
        >
          冒険の準備ができました！
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#546757]">
          条件をこのタブに保存しました。目的地選択・冒険開始はまだ準備中です。
        </p>
        <dl className="my-6 divide-y divide-[#d8dece]">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[5rem_1fr] gap-3 py-4">
              <dt className="text-sm text-[#546757]">{label}</dt>
              <dd className="font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            setForm((current) => ({
              ...current,
              phase: "editing",
              message: "変更後は、もう一度確定すると保存内容が更新されます。",
            }))
          }
        >
          条件を変更する
        </button>
        <button type="button" disabled className={`${buttonClass} mt-3`}>
          冒険開始（準備中）
        </button>
      </section>
    );
  }
  return (
    <form
      onSubmit={confirm}
      className="max-w-2xl space-y-8"
      aria-labelledby="setup-form-heading"
    >
      <h2
        id="setup-form-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold"
      >
        冒険の条件
      </h2>
      {form.message && (
        <p
          role="status"
          className="rounded-xl bg-[#e7ecd9] p-4 text-sm leading-7"
        >
          {form.message}
        </p>
      )}
      <ChoiceGroup
        legend="01　何で出かける？"
        name="vehicle"
        options={vehicleOptions}
        value={form.draft.vehicleType}
        onChange={(value) => change("vehicleType", value)}
      />
      <ChoiceGroup
        legend="02　所要時間（片道の目安）"
        name="duration"
        options={durationOptions}
        value={form.draft.durationMinutes}
        onChange={(value) => change("durationMinutes", value)}
      />
      <ChoiceGroup
        legend="03　どんな場所に出会いたい？"
        name="category"
        options={categoryOptions}
        value={form.draft.category}
        onChange={(value) => change("category", value)}
      />
      <div className="rounded-2xl bg-[#e7ecd9] p-5">
        <p id="setup-status" className="text-sm leading-7">
          3つの条件を選択して確定してください。確定した条件は、このタブを再読み込みしても復元できます。
        </p>
        {form.error && (
          <p role="alert" className="mt-3 font-bold text-[#913716]">
            {form.error}
          </p>
        )}
        <button
          type="submit"
          disabled={!parseSetupDraft(form.draft)}
          aria-describedby="setup-status"
          className={`${buttonClass} mt-4`}
        >
          条件を確定する
        </button>
      </div>
    </form>
  );
}

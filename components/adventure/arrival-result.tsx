"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { ActionLink } from "@/components/ui/action-link";
import { useAdventurePlan } from "./plan-context";
import type { Category } from "@/types/adventure";

const categoryLabels: Record<Exclude<Category, "random">, string> = {
  scenery: "絶景",
  nature: "自然",
  history: "歴史",
  hot_spring: "温泉",
  roadside_station: "道の駅",
};

export function ArrivalResult() {
  const { plan, setPlan } = useAdventurePlan();
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const destination = plan?.status === "revealed" && plan.destination?.id === plan.destinationId
    ? plan.destination
    : null;

  if (!destination) return <>
    <PageHeading eyebrow="目的地の公開" title="冒険が完了していません">
      この画面は、GPSで到着を確認した冒険からのみ表示できます。
    </PageHeading>
    <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6">
      <p className="mb-6 leading-7">中断後や再読み込み後は到着状態を復元できません。条件を選び直して、新しい冒険を始めてください。</p>
      <ActionLink href="/setup">条件入力へ進む</ActionLink>
    </section>
  </>;

  return <div className="motion-safe:animate-[destination-reveal_700ms_ease-out]">
    <PageHeading eyebrow="今回の目的地" title="🎉 冒険達成！">
      GPSによる到着を確認しました。目的地を公開します。
    </PageHeading>
    <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6 sm:p-10">
      <p className="text-sm text-[#667944]">{categoryLabels[destination.category]}</p>
      <h2 className="mt-3 text-3xl font-bold">{destination.name}</h2>
      <div className="relative my-6 aspect-video overflow-hidden rounded-2xl bg-[#e7ecd9]">
        {/* A native image can show destination-owned URLs without pre-authorizing arbitrary hosts in Next config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={!imageFailed && destination.imageUrl ? destination.imageUrl : "/images/placeholder.svg"} alt={!imageFailed && destination.imageUrl ? `${destination.name}の写真` : "目的地の写真は未登録、または読み込めませんでした"} onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
      </div>
      <h3 className="font-bold">この場所について</h3>
      <p className="mt-3 text-sm leading-7 text-[#546757]">{destination.description}</p>
      {destination.openingInfo.note && <p className="mt-3 text-sm leading-7">営業時間情報: {destination.openingInfo.note}</p>}
      {destination.sourceUrl && <a href={destination.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block min-h-11 underline">地点情報をOpenStreetMapで確認</a>}
      <p className="mt-5 text-xs leading-6">営業時間、駐車場所、立入条件は現地の案内を優先してください。</p>
      <button type="button" onClick={() => { setPlan(null); router.replace("/"); }} className="mt-6 min-h-12 w-full rounded-xl bg-[#344b33] px-5 font-bold text-white">冒険を終了する</button>
    </section>
  </div>;
}

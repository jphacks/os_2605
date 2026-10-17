import { sealDestination } from "@/lib/seal";
import type { AdventurePlan, PublicAdventurePlan, Route } from "@/types/adventure";

/**
 * クライアントへ返す形に変換する。目的地の名称・座標・ジャンルは含めず、
 * 到着判定と到着後の公開に使う情報はサーバーだけが開けられる形に封印する。
 * 注意: 経路形状(geometry)の終端は目的地付近を指すため、完全な秘匿ではない。
 */
export function toPublicPlan(plan: AdventurePlan): PublicAdventurePlan {
  if (!plan.destination || !plan.route) throw new Error("plan is not ready");
  const route: Partial<Route> & { destinationId?: string } = { ...plan.route };
  delete route.destination;
  delete route.destinationId; // 検証用の固定データにだけ付く目的地ID
  return {
    adventureId: plan.adventureId,
    settings: { ...plan.settings, category: "random" },
    origin: plan.origin,
    estimatedDurationMinutes: plan.estimatedDurationMinutes,
    status: plan.status,
    mode: plan.mode,
    route: route as PublicAdventurePlan["route"],
    sealedDestination: sealDestination(plan.destination),
  };
}

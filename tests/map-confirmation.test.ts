import { expect, it } from "vitest";
import { MAP_CONFIRMATIONS, advanceMapConfirmation, type MapConfirmationStep } from "@/features/adventure/map-confirmation";
it("指定された3つの確認を順に通過するまで地図を表示しない", () => {
  expect(MAP_CONFIRMATIONS).toEqual(["マップを表示しますか？", "本当にマップを表示しますか？", "本当によろしいですね？"]);
  let step: MapConfirmationStep = 0;
  step = advanceMapConfirmation(step); expect(step).toBe(1);
  step = advanceMapConfirmation(step); expect(step).toBe(2);
  step = advanceMapConfirmation(step); expect(step).toBe("map");
});

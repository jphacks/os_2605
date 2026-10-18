import { describe, expect, it, vi } from "vitest";
import {
  createAnnouncements,
  voiceThresholds,
  spokenDistance,
  SpeechService,
  type SpeechBackend,
} from "@/lib/speech";
import type { NavigationGuidance } from "@/lib/navigation/engine";

function guidance(
  distance: number,
  maneuver: NavigationGuidance["step"]["maneuver"] = "TURN_RIGHT",
  stepId = "turn-1",
): NavigationGuidance {
  return {
    status: "navigating",
    stepIndex: 1,
    distanceToStepMeters: distance,
    remainingDistanceMeters: 1_000,
    remainingDurationSeconds: 300,
    step: {
      id: stepId,
      location: { lat: 35, lng: 135 },
      endLocation: { lat: 35, lng: 135.01 },
      maneuver,
      instruction: "右折",
      distanceMeters: 500,
      durationSeconds: 100,
      distanceFromOriginMeters: 500,
    },
    progress: { progressMeters: 400, geometryIndex: 1, stepIndex: 1, regressionCount: 0 },
  };
}

function backend(supported = true) {
  return { isSupported: vi.fn(() => supported), speak: vi.fn(), cancel: vi.fn() } satisfies SpeechBackend;
}

function enabledService(output = backend()) {
  const service = new SpeechService(output);
  service.setEnabled(true);
  return { service, output };
}

describe("spoken text", () => {
  it("距離は画面と同じ丸め（10m単位、1km以上はキロ）", () => {
    expect(spokenDistance(143)).toBe("140メートル");
    expect(spokenDistance(4)).toBe("10メートル");
    expect(spokenDistance(1_000)).toBe("1キロ");
    expect(spokenDistance(1_240)).toBe("1.2キロ");
  });

  it("「140メートル先、右折です」「100メートル直進です」の形で読み上げる", () => {
    expect(createAnnouncements("r", guidance(140)).at(-1)?.text).toBe("140メートル先、右折です");
    expect(createAnnouncements("r", guidance(140, "TURN_LEFT")).at(-1)?.text).toBe("140メートル先、左折です");
    expect(createAnnouncements("r", guidance(100, "STRAIGHT")).at(-1)?.text).toBe("100メートル直進です");
    expect(createAnnouncements("r", guidance(500, "SLIGHT_RIGHT")).at(-1)?.text).toBe("500メートル先、やや右方向です");
  });

  it("案内が表示された時点・300m以内・80m以内の段階を距離に応じて返す", () => {
    expect(createAnnouncements("r", guidance(900)).map((a) => a.phase)).toEqual(["start"]);
    expect(createAnnouncements("r", guidance(250)).map((a) => a.phase)).toEqual(["start", "early"]);
    expect(createAnnouncements("r", guidance(60)).map((a) => a.phase)).toEqual(["start", "early", "near"]);
    expect(createAnnouncements("r", guidance(60)).at(-1)?.text).toBe("まもなく、右折です");
  });

  it("到着の案内と案内停止中は読み上げない。分岐などの案内は汎用の文言で読む", () => {
    expect(createAnnouncements("r", guidance(500, "OTHER")).at(-1)?.text).toBe("500メートル先、進路に注意してください");
    expect(createAnnouncements("r", guidance(50, "ARRIVE"))).toEqual([]);
    expect(createAnnouncements("r", { ...guidance(50), status: "off-route" })).toEqual([]);
  });
});

describe("SpeechService", () => {
  it("表示が切り替わるたびに読み上げる", () => {
    const { service, output } = enabledService();
    service.announceGuidance("r", guidance(140, "TURN_RIGHT", "a"));
    service.announceGuidance("r", guidance(100, "STRAIGHT", "b"));
    expect(output.speak.mock.calls.map((c) => c[0])).toEqual(["140メートル先、右折です", "100メートル直進です"]);
  });

  it("同じ案内の距離が変わるだけでは繰り返さず、80mで「まもなく」を1回読む", () => {
    const { service, output } = enabledService();
    for (const distance of [700, 690, 300, 290, 120, 85]) service.announceGuidance("r", guidance(distance));
    expect(output.speak.mock.calls.map((c) => c[0])).toEqual(["700メートル先、右折です", "300メートル先、右折です"]);
    service.announceGuidance("r", guidance(80));
    service.announceGuidance("r", guidance(40));
    expect(output.speak.mock.calls.at(-1)?.[0]).toBe("まもなく、右折です");
    expect(output.speak).toHaveBeenCalledTimes(3);
  });

  it("近い距離で初めて表示された案内は、二重に話さず1回だけ読む", () => {
    const { service, output } = enabledService();
    service.announceGuidance("r", guidance(60));
    service.announceGuidance("r", guidance(50));
    expect(output.speak).toHaveBeenCalledTimes(1);
  });

  it("OFFや非対応では無音。reset は読み上げ済みだけを忘れ、ON/OFFを変えない", () => {
    const off = backend();
    expect(new SpeechService(off).announceGuidance("r", guidance(100))).toBe(false);
    expect(off.speak).not.toHaveBeenCalled();
    const unsupported = new SpeechService(backend(false));
    expect(unsupported.setEnabled(true)).toBe(false);
    expect(unsupported.isEnabled()).toBe(false);

    const { service, output } = enabledService();
    service.announceGuidance("r", guidance(100));
    service.reset();
    expect(service.isEnabled()).toBe(true);
    expect(output.cancel).toHaveBeenCalled();
    service.announceGuidance("r", guidance(100));
    expect(output.speak).toHaveBeenCalledTimes(2);
    service.dispose();
    expect(service.isEnabled()).toBe(false);
  });
});

describe("経路に応じた読み上げ距離", () => {
  it("想定速度が速い道ほど手前から、遅い道ほど近くで知らせる（約20秒前・約6秒前）", () => {
    expect(voiceThresholds(11.1)).toEqual({ early: 222, near: 67 }); // 市街地 約40km/h
    expect(voiceThresholds(27.8)).toEqual({ early: 556, near: 167 }); // 高速 約100km/h
  });

  it("極端な速度は範囲内に収める。速度が不明なら300m・80m", () => {
    expect(voiceThresholds(2)).toEqual({ early: 150, near: 40 });
    expect(voiceThresholds(60)).toEqual({ early: 800, near: 250 });
    expect(voiceThresholds(undefined)).toEqual({ early: 300, near: 80 });
    expect(voiceThresholds(Number.NaN)).toEqual({ early: 300, near: 80 });
    expect(voiceThresholds(0)).toEqual({ early: 300, near: 80 });
  });

  it("同じ距離でも、高速の道では手前の読み上げ段階に入り、低速の道では入らない", () => {
    const at = (speed: number) => ({ ...guidance(400), approachSpeedMetersPerSecond: speed });
    expect(createAnnouncements("r", at(27.8)).map((a) => a.phase)).toEqual(["start", "early"]);
    expect(createAnnouncements("r", at(5)).map((a) => a.phase)).toEqual(["start"]);
    const near = (speed: number) => ({ ...guidance(150), approachSpeedMetersPerSecond: speed });
    expect(createAnnouncements("r", near(27.8)).map((a) => a.phase)).toEqual(["start", "early", "near"]);
    expect(createAnnouncements("r", near(11.1)).map((a) => a.phase)).toEqual(["start", "early"]);
  });
});

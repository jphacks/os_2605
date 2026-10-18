import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserBackend, OPENING_PHRASE, SpeechService, type SpeakOptions, type SpeechBackend } from "@/lib/speech";
import type { NavigationGuidance } from "@/lib/navigation/engine";

function guidance(distance = 500, maneuver: NavigationGuidance["step"]["maneuver"] = "TURN_RIGHT"): NavigationGuidance {
  return {
    status: "navigating", stepIndex: 1, distanceToStepMeters: distance, remainingDistanceMeters: 1_000, remainingDurationSeconds: 300,
    step: { id: "turn-1", location: { lat: 35, lng: 135 }, endLocation: { lat: 35, lng: 135.01 }, maneuver, instruction: "右折", distanceMeters: 500, durationSeconds: 100, distanceFromOriginMeters: 500 },
    progress: { progressMeters: 400, geometryIndex: 1, stepIndex: 1, regressionCount: 0 },
  };
}
function backend() {
  const speak = vi.fn<(text: string, options?: SpeakOptions) => void>();
  return { isSupported: () => true, speak, cancel: vi.fn() } satisfies SpeechBackend;
}
const enabled = () => { const output = backend(); const service = new SpeechService(output); service.setEnabled(true); return { service, output }; };

describe("最初の発話（出発のタップ）", () => {
  it("「出発」のタップの中で、読み上げ中の音声を切らずに最初の発話をする", () => {
    const { service, output } = enabled();
    expect(service.prime()).toBe(true);
    expect(output.speak).toHaveBeenCalledWith(OPENING_PHRASE, { interrupt: false });
  });

  it("音声がOFFなら何も話さない", () => {
    const output = backend();
    expect(new SpeechService(output).prime()).toBe(false);
    expect(output.speak).not.toHaveBeenCalled();
  });

  it("最初の案内は割り込まず（開始の発話を切らない）、手前の予告は割り込む", () => {
    const { service, output } = enabled();
    service.announceGuidance("r", guidance(900));
    expect(output.speak.mock.calls[0][1]?.interrupt).toBe(false);
    service.announceGuidance("r", guidance(60));
    expect(output.speak.mock.calls[1][0]).toBe("まもなく、右折です");
    expect(output.speak.mock.calls[1][1]?.interrupt).toBe(true);
  });
});

describe("発話の失敗", () => {
  it("失敗した案内は読み上げ済みにせず、次の更新で読み直す（上限3回）", () => {
    const { service, output } = enabled();
    service.announceGuidance("r", guidance(900));
    for (let i = 0; i < 6; i += 1) {
      output.speak.mock.calls.at(-1)?.[1]?.onError?.("not-allowed");
      service.announceGuidance("r", guidance(890 - i));
    }
    // 最初の1回＋再試行3回で止まる
    expect(output.speak).toHaveBeenCalledTimes(4);
  });

  it("失敗しなければ繰り返さない", () => {
    const { service, output } = enabled();
    service.announceGuidance("r", guidance(900));
    service.announceGuidance("r", guidance(890));
    expect(output.speak).toHaveBeenCalledTimes(1);
  });

  it("音声をONにした操作の中で、今の案内をもう一度読む", () => {
    const { service, output } = enabled();
    service.announceGuidance("r", guidance(900));
    service.announceGuidance("r", guidance(880));
    expect(output.speak).toHaveBeenCalledTimes(1);
    expect(service.replay("r", guidance(880))).toBe(true);
    expect(output.speak).toHaveBeenCalledTimes(2);
    expect(output.speak.mock.calls[1][0]).toBe("880メートル先、右折です");
  });
});

describe("ブラウザの音声", () => {
  const original = { window: (globalThis as { window?: unknown }).window, utterance: (globalThis as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance };
  afterEach(() => {
    vi.useRealTimers();
    (globalThis as { window?: unknown }).window = original.window;
    (globalThis as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = original.utterance;
  });
  function install(state: { speaking: boolean; pending: boolean }) {
    const spoken: unknown[] = [];
    const synth = { ...state, getVoices: () => [{ lang: "ja-JP" }], cancel: vi.fn(), speak: vi.fn((u: unknown) => spoken.push(u)) };
    class Utterance { lang = ""; rate = 1; voice: unknown; onend?: () => void; onerror?: (e: unknown) => void; constructor(public text: string) {} }
    const fake = { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance };
    (globalThis as { window?: unknown }).window = fake;
    (globalThis as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance = Utterance;
    return { synth, spoken };
  }

  it("読み上げ中でなければcancelせず、その場で話す（操作の中での最初の発話を守る）", () => {
    const { synth } = install({ speaking: false, pending: false });
    createBrowserBackend().speak("こんにちは");
    expect(synth.cancel).not.toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("読み上げ中に割り込むときは、cancelの後に少し待ってから話す", () => {
    vi.useFakeTimers();
    const { synth } = install({ speaking: true, pending: false });
    createBrowserBackend().speak("割り込み");
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("日本語の音声を選び、失敗は通知するが中断・キャンセルは通知しない", () => {
    const { spoken } = install({ speaking: false, pending: false });
    const onError = vi.fn();
    createBrowserBackend().speak("テスト", { onError });
    const utterance = spoken[0] as { lang: string; voice: { lang: string }; onerror: (e: unknown) => void };
    expect(utterance.lang).toBe("ja-JP");
    expect(utterance.voice).toEqual({ lang: "ja-JP" });
    utterance.onerror({ error: "interrupted" });
    utterance.onerror({ error: "canceled" });
    expect(onError).not.toHaveBeenCalled();
    utterance.onerror({ error: "not-allowed" });
    expect(onError).toHaveBeenCalledWith("not-allowed");
  });

  it("非対応の環境では何もしない", () => {
    (globalThis as { window?: unknown }).window = {};
    expect(createBrowserBackend().isSupported()).toBe(false);
    expect(() => createBrowserBackend().speak("x")).not.toThrow();
  });
});

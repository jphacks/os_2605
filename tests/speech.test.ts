import { describe, expect, it, vi } from "vitest";
import { createAnnouncement, SpeechService, type SpeechBackend } from "@/lib/speech";
import type { NavigationGuidance } from "@/lib/navigation/engine";

function guidance(distance: number, maneuver: NavigationGuidance["step"]["maneuver"] = "TURN_RIGHT"): NavigationGuidance {
  return {
    status: "navigating", stepIndex: 1, distanceToStepMeters: distance, remainingDistanceMeters: 1_000, remainingDurationSeconds: 300,
    step: { id: "turn-1", location: { lat: 35, lng: 135 }, endLocation: { lat: 35, lng: 135.01 }, maneuver, instruction: "右折", distanceMeters: 500, durationSeconds: 100, distanceFromOriginMeters: 500 },
    progress: { progressMeters: 400, geometryIndex: 1, stepIndex: 1, regressionCount: 0 },
  };
}

function backend(supported = true) {
  return { isSupported: vi.fn(() => supported), speak: vi.fn(), cancel: vi.fn() } satisfies SpeechBackend;
}

describe("speech guidance", () => {
  it("creates separate Japanese announcements at 300m and 80m", () => {
    expect(createAnnouncement("route", guidance(300))).toMatchObject({ phase: "early", text: "300メートル先、右方向です" });
    expect(createAnnouncement("route", guidance(80))).toMatchObject({ phase: "near", text: "まもなく、右方向です" });
    expect(createAnnouncement("route", guidance(301))).toBeNull();
    expect(createAnnouncement("route", guidance(50, "OTHER"))).toBeNull();
  });

  it("does not repeat the same route, step, and phase", () => {
    const output = backend();
    const service = new SpeechService(output);
    expect(service.setEnabled(true)).toBe(true);
    const announcement = createAnnouncement("route", guidance(250));
    expect(service.announce(announcement)).toBe(true);
    expect(service.announce(announcement)).toBe(false);
    expect(output.speak).toHaveBeenCalledOnce();
    service.dispose();
    expect(output.cancel).toHaveBeenCalled();
  });

  it("stays silent while disabled or unsupported", () => {
    const disabledOutput = backend();
    expect(new SpeechService(disabledOutput).announce(createAnnouncement("route", guidance(50)))).toBe(false);
    expect(disabledOutput.speak).not.toHaveBeenCalled();
    const unsupportedOutput = backend(false);
    const service = new SpeechService(unsupportedOutput);
    expect(service.setEnabled(true)).toBe(false);
    expect(service.announce(createAnnouncement("route", guidance(50)))).toBe(false);
    expect(unsupportedOutput.speak).not.toHaveBeenCalled();
  });
});

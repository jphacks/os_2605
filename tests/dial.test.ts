import { describe, expect, it } from "vitest";
import {
  DIAL,
  angleFromOffset,
  angleOfMinutes,
  clampMinutes,
  dialMinutes,
  pointOnDial,
} from "@/features/adventure/dial";

const f = (n: number) => n.toFixed(1);

describe("dial geometry", () => {
  it("1周=120分、真上=0分、時計回り", () => {
    expect(angleOfMinutes(0)).toBe(0);
    expect(angleOfMinutes(30)).toBe(90);
    expect(angleOfMinutes(60)).toBe(180);
    expect(angleOfMinutes(90)).toBe(270);
    expect(angleOfMinutes(120)).toBe(360);
  });

  it("design-ref/02_time.html の座標と一致する（90分のつまみ・主な目盛り・ラベル）", () => {
    const knob = pointOnDial(90, DIAL.trackRadius);
    expect([f(knob.x), f(knob.y)]).toEqual(["67.0", "372.0"]);
    const top = pointOnDial(0, DIAL.trackRadius);
    expect([f(top.x), f(top.y)]).toEqual(["195.0", "244.0"]);
    // 5分ごとの短い目盛り（15°）と15分ごとの長い目盛り（45°）
    const minor = pointOnDial(5, DIAL.tickInner);
    expect([f(minor.x), f(minor.y)]).toEqual(["231.8", "234.8"]);
    const minorEnd = pointOnDial(5, DIAL.minorOuter);
    expect([f(minorEnd.x), f(minorEnd.y)]).toEqual(["233.6", "228.1"]);
    const major = pointOnDial(15, DIAL.tickInner);
    expect([f(major.x), f(major.y)]).toEqual(["295.4", "271.6"]);
    const majorEnd = pointOnDial(15, DIAL.majorOuter);
    expect([f(majorEnd.x), f(majorEnd.y)]).toEqual(["303.9", "263.1"]);
    const label = pointOnDial(30, DIAL.labelRadius);
    expect([f(label.x), f(label.y + 5)]).toEqual(["373.0", "377.0"]);
  });

  it("中心からの向きを角度にする", () => {
    expect(angleFromOffset(0, -10)).toBe(0);
    expect(angleFromOffset(10, 0)).toBeCloseTo(90);
    expect(angleFromOffset(0, 10)).toBeCloseTo(180);
    expect(angleFromOffset(-10, 0)).toBeCloseTo(270);
  });
});

describe("dialMinutes", () => {
  it("0〜120分の1分刻みに丸める", () => {
    expect(dialMinutes(90, null)).toBe(30);
    expect(dialMinutes(180, null)).toBe(60);
    expect(dialMinutes(270, null)).toBe(90);
    expect(dialMinutes(200, null)).toBe(67);
    expect(dialMinutes(225, null)).toBe(75);
    expect(dialMinutes(350, null)).toBe(117);
  });

  it("上端付近も1分刻みで選択し、120分から上端をまたぐと端に留まる", () => {
    expect(dialMinutes(10, null)).toBe(3);
    expect(dialMinutes(10, 30)).toBe(3);
    expect(dialMinutes(10, 120)).toBe(120);
    expect(dialMinutes(60, 105)).toBe(120);
  });

  it("上端をまたいで反対側へ飛ばない", () => {
    expect(dialMinutes(340, 30)).toBe(0);
    expect(dialMinutes(60, 120)).toBe(120);
    expect(dialMinutes(300, 90)).toBe(100);
  });

  it("clampMinutes は範囲と刻みに収める", () => {
    expect(clampMinutes(10)).toBe(10);
    expect(clampMinutes(200)).toBe(120);
    expect(clampMinutes(52)).toBe(52);
  });
});

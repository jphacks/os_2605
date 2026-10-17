// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createAdventure } from "@/features/adventure/adventure-service";
import {
  PLAN_STORAGE_KEY,
  SETUP_STORAGE_KEY,
} from "@/features/adventure/storage";
import { DestinationFlow } from "@/components/adventure/destination-flow";

const setup = {
  vehicleType: "motorcycle",
  durationMinutes: 90,
  category: "scenery",
};

function mockApi(random: () => number = Math.random) {
  const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    const response = createAdventure(body, { rng: random });
    return { json: async () => response } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  sessionStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DestinationFlow", () => {
  it("保存された条件がなければ再設定を求める", async () => {
    render(<DestinationFlow />);
    expect(await screen.findByText("条件がまだ選ばれていません")).toBeTruthy();
    expect(screen.getByRole("link", { name: "条件を設定する" })).toBeTruthy();
  });

  it("不正な保存データは破棄して再設定を求める", async () => {
    sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify({ x: 1 }));
    render(<DestinationFlow />);
    expect(
      await screen.findByText("保存された条件が正しくありません"),
    ).toBeTruthy();
    expect(sessionStorage.getItem(SETUP_STORAGE_KEY)).toBeNull();
  });

  it("条件を確認し、目的地を決めても名称は表示されない", async () => {
    sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
    mockApi();
    render(<DestinationFlow />);
    expect(await screen.findByText("バイク")).toBeTruthy();
    expect(screen.getByText("90分")).toBeTruthy();
    expect(screen.getByText("絶景")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "目的地を探す" }));
    expect(await screen.findByText("🎉 目的地が決まりました！")).toBeTruthy();
    expect(screen.getByText("行き先は、まだ秘密です。")).toBeTruthy();
    expect(screen.getByText("経路の準備は次の開発で実装予定")).toBeTruthy();
    const start = screen.getByRole("button", { name: "冒険を開始する" });
    expect((start as HTMLButtonElement).disabled).toBe(true);

    const text = document.body.textContent ?? "";
    expect(text).not.toContain("検証用スポット");
    expect(text).not.toContain("開発確認用");
    expect(document.body.innerHTML).not.toMatch(/spot-0\d\d/);
    expect(
      JSON.parse(sessionStorage.getItem(PLAN_STORAGE_KEY) ?? "null"),
    ).toMatchObject({ status: "ready", mode: "demo" });
  });

  it("連続クリックしても選択は1回だけ", async () => {
    sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
    const fetchMock = mockApi();
    render(<DestinationFlow />);
    const button = await screen.findByRole("button", { name: "目的地を探す" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(await screen.findByText("🎉 目的地が決まりました！")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("再レンダリングや再表示で目的地が変わらない", async () => {
    sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
    const rng = vi.fn(() => 0.1);
    const fetchMock = mockApi(rng);
    const { rerender, unmount } = render(<DestinationFlow />);
    fireEvent.click(
      await screen.findByRole("button", { name: "目的地を探す" }),
    );
    await screen.findByText("🎉 目的地が決まりました！");
    const saved = sessionStorage.getItem(PLAN_STORAGE_KEY);

    rerender(<DestinationFlow />);
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBe(saved);

    unmount();
    render(<DestinationFlow />);
    expect(await screen.findByText("🎉 目的地が決まりました！")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(rng).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBe(saved);
  });

  it("条件に合う目的地がなければ見つからない旨と条件変更を示す", async () => {
    sessionStorage.setItem(
      SETUP_STORAGE_KEY,
      JSON.stringify({ ...setup, durationMinutes: 30 }),
    );
    mockApi();
    render(<DestinationFlow />);
    fireEvent.click(
      await screen.findByRole("button", { name: "目的地を探す" }),
    );
    expect(
      await screen.findByText("条件に合う目的地が見つかりませんでした"),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "条件を変更する" })).toBeTruthy();
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBeNull();
  });

  it("通信失敗時はエラーを表示し、プランを保存しない", async () => {
    sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("x"))),
    );
    render(<DestinationFlow />);
    fireEvent.click(
      await screen.findByRole("button", { name: "目的地を探す" }),
    );
    expect(await screen.findByText("通信に失敗しました")).toBeTruthy();
    expect(screen.getByRole("button", { name: "もう一度探す" })).toBeTruthy();
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBeNull();
  });
});

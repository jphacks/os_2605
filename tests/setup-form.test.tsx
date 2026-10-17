// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SetupForm } from "@/components/adventure/setup-form";
import {
  PLAN_STORAGE_KEY,
  SETUP_STORAGE_KEY,
} from "@/features/adventure/storage";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  sessionStorage.clear();
  push.mockReset();
});
afterEach(cleanup);

describe("SetupForm", () => {
  it("3項目がそろうまで送信できない", () => {
    render(<SetupForm />);
    const submit = screen.getByRole("button", { name: "目的地を探す" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText("バイク"));
    fireEvent.click(screen.getByLabelText("90分"));
    expect((submit as HTMLButtonElement).disabled).toBe(true);
  });

  it("条件を保存し、古い決定結果を消して目的地決定画面へ進む", () => {
    sessionStorage.setItem(PLAN_STORAGE_KEY, "{}");
    render(<SetupForm />);
    fireEvent.click(screen.getByLabelText("バイク"));
    fireEvent.click(screen.getByLabelText("90分"));
    fireEvent.click(screen.getByLabelText("絶景"));
    fireEvent.click(screen.getByRole("button", { name: "目的地を探す" }));
    expect(
      JSON.parse(sessionStorage.getItem(SETUP_STORAGE_KEY) ?? "null"),
    ).toEqual({
      vehicleType: "motorcycle",
      durationMinutes: 90,
      category: "scenery",
    });
    expect(sessionStorage.getItem(PLAN_STORAGE_KEY)).toBeNull();
    expect(push).toHaveBeenCalledWith("/adventure/destination");
  });
});

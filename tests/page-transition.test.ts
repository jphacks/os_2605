import { describe, expect, it } from "vitest";
import { isTransitionableHref, titleSlideDirection } from "@/components/navigation/page-transition";

describe("page transition navigation", () => {
  const current = "https://example.com/setup?minutes=30";

  it("slides only between the title and setup, in opposite directions", () => {
    expect(titleSlideDirection("/", "/setup")).toBe(1);
    expect(titleSlideDirection("/setup", "/")).toBe(-1);
    for (const [from, to] of [["/setup", "/search"], ["/search", "/decided"], ["/decided", "/setup"], ["/arrived", "/"], ["/", "/"]]) {
      expect(titleSlideDirection(from, to)).toBe(0);
    }
  });

  it("accepts another internal page", () => {
    expect(isTransitionableHref("/search?minutes=30", current)).toBe(true);
  });

  it("does not intercept an external destination", () => {
    expect(isTransitionableHref("https://other.example/search", current)).toBe(false);
  });

  it("does not animate the same page or a hash-only link", () => {
    expect(isTransitionableHref("/setup?minutes=30", current)).toBe(false);
    expect(isTransitionableHref("#dial", current)).toBe(false);
  });
});

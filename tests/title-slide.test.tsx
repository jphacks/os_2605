import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the transition's DOM effects without installing a browser runtime.
const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as (() => void)[],
  pathname: "/",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => harness.pathname,
  useRouter: () => ({ push: harness.push, replace: harness.replace }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  const effect = (callback: () => void | (() => void), deps: unknown[]) => {
    const index = harness.cursor++;
    const previous = harness.slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
    if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
    harness.effects.push(() => {
      previous?.cleanup?.();
      harness.slots[index] = { deps, cleanup: callback() };
    });
  };
  return {
    ...actual,
    useRef: (initial: unknown) => {
      const index = harness.cursor++;
      return harness.slots[index] ??= { current: initial };
    },
    useState: (initial: unknown) => {
      const index = harness.cursor++;
      if (!(index in harness.slots)) harness.slots[index] = initial;
      return [harness.slots[index], (value: unknown) => { harness.slots[index] = value; }];
    },
    useEffect: effect,
    useLayoutEffect: effect,
    useCallback: (callback: unknown) => callback,
    useMemo: (factory: () => unknown) => factory(),
  };
});

import { PageTransitionProvider } from "@/components/navigation/page-transition";

function animatedNode() {
  return {
    style: {} as Record<string, string>,
    animate: vi.fn((frames: Keyframe[]) => ({ frames, startTime: null as number | null, cancel: vi.fn(), onfinish: null as (() => void) | null, oncancel: null as (() => void) | null })),
  };
}

function screen(width: number, visible = true) {
  const wrapper = animatedNode();
  const canvas = animatedNode();
  return {
    ...animatedNode(),
    firstElementChild: wrapper,
    canvas,
    inert: false,
    setAttribute: vi.fn(),
    remove: vi.fn(),
    querySelectorAll: () => [wrapper, canvas],
    querySelector: () => canvas,
    getBoundingClientRect: () => ({ width }),
    getClientRects: () => visible ? [{ width }] : [],
    cloneNode: () => screen(width),
  };
}

let currentScreen: ReturnType<typeof screen>;
let retainedScreen: ReturnType<typeof screen> | undefined;
let snapshots: ReturnType<typeof screen>[];
let locked: boolean;
let reducedMotion: boolean;
let popstate: (() => void) | undefined;
let location: { pathname: string; href: string };

function render(pathname: string) {
  harness.pathname = pathname;
  location.pathname = pathname;
  location.href = `http://localhost${pathname}`;
  harness.cursor = 0;
  harness.effects = [];
  const tree = PageTransitionProvider({ children: null });
  const container = tree.props.children[0];
  container.props.ref.current = {
    querySelectorAll: () => retainedScreen ? [retainedScreen, currentScreen] : [currentScreen],
    // Route replacement can insert the live screen after the retained snapshot.
    querySelector: (selector: string) => selector === "main" && snapshots.length
      ? snapshots[snapshots.length - 1]
      : currentScreen,
    appendChild: (snapshot: ReturnType<typeof screen>) => { snapshots.push(snapshot); },
    setAttribute: () => { locked = true; },
    removeAttribute: () => { locked = false; },
  };
  harness.effects.forEach((effect) => effect());
  return { navigate: tree.props.value.navigate, className: container.props.className };
}

beforeEach(() => {
  vi.useFakeTimers();
  harness.slots = [];
  vi.clearAllMocks();
  snapshots = [];
  retainedScreen = undefined;
  locked = false;
  reducedMotion = false;
  popstate = undefined;
  location = { pathname: "/", href: "http://localhost/" };
  vi.stubGlobal("window", {
    location,
    setTimeout,
    clearTimeout,
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (name: string, callback: () => void) => { if (name === "popstate") popstate = callback; },
    removeEventListener: () => {},
  });
  vi.stubGlobal("document", { timeline: { currentTime: 123 } });
  vi.stubGlobal("getComputedStyle", () => ({ animationName: "none", display: "block", opacity: "1", transform: "none", filter: "none", backgroundColor: "rgb(228, 236, 230)" }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("title slide DOM effects", () => {
  it("ignores a hidden retained route and allows setup to search after the slide", () => {
    currentScreen = screen(390);
    render("/").navigate("/setup");
    retainedScreen = screen(390, false);
    currentScreen = screen(390);
    render("/setup");
    expect(retainedScreen.firstElementChild.animate).not.toHaveBeenCalled();
    currentScreen.firstElementChild.animate.mock.results[0].value.onfinish?.();
    render("/setup").navigate("/search");
    vi.advanceTimersByTime(1_150);
    expect(harness.push).toHaveBeenLastCalledWith("/search");
    expect(locked).toBe(false);
  });

  it.each(["finish", "cancel", "timeout"])("allows ordinary navigation after a slide %s", (outcome) => {
    currentScreen = screen(390);
    render("/").navigate("/setup");
    currentScreen = screen(390);
    render("/setup");
    const enter = currentScreen.firstElementChild.animate.mock.results[0].value;
    if (outcome === "finish") enter.onfinish?.();
    else if (outcome === "cancel") enter.oncancel?.();
    else vi.advanceTimersByTime(10_000);
    expect(locked).toBe(false);
    render("/setup").navigate("/search");
    vi.advanceTimersByTime(1_150);
    expect(harness.push).toHaveBeenLastCalledWith("/search");
    vi.advanceTimersByTime(1_540);
    render("/decided").navigate("/adventure");
    vi.advanceTimersByTime(2_900);
    expect(harness.push).toHaveBeenLastCalledWith("/adventure");
  });

  it.each([390, 1440])("moves content across the full %ipx viewport and releases the screen", (width) => {
    currentScreen = screen(width);
    const { navigate } = render("/");
    navigate("/setup");
    expect(harness.push).toHaveBeenCalledWith("/setup");
    expect(locked).toBe(false);
    currentScreen = screen(width);
    render("/setup");
    const enter = currentScreen.firstElementChild.animate.mock.results[0].value;
    const leave = snapshots[0].firstElementChild.animate.mock.results[0].value;
    expect(enter.frames[0].transform).toBe(`translateX(${width}px)`);
    expect(leave.frames[1].transform).toBe(`translateX(${-width}px)`);
    expect(leave.startTime).toBe(123);
    enter.onfinish?.();
    expect(locked).toBe(false);
    expect(snapshots[0].remove).toHaveBeenCalledOnce();
  });

  it("uses the reverse slide on browser back and the forward slide on browser forward", () => {
    currentScreen = screen(1440);
    render("/setup");
    location.pathname = "/";
    popstate?.();
    currentScreen = screen(1440);
    expect(render("/").className).toBeTruthy();
    const enter = currentScreen.firstElementChild.animate.mock.results[0].value;
    expect(enter.frames[0].transform).toBe("translateX(-1440px)");
    enter.onfinish?.();
    location.pathname = "/setup";
    popstate?.();
    currentScreen = screen(1440);
    render("/setup");
    expect(currentScreen.firstElementChild.animate.mock.results[0].value.frames[0].transform).toBe("translateX(1440px)");
    expect(harness.push).not.toHaveBeenCalled();
  });

  it("preserves the completed title when its return class is removed", () => {
    currentScreen = screen(390);
    const { navigate } = render("/");
    navigate("/setup");
    expect(snapshots[0].firstElementChild.style.opacity).toBe("1");
    expect(snapshots[0].firstElementChild.style.animation).toBe("none");
  });

  it("skips animation and locking when reduced motion is requested", () => {
    reducedMotion = true;
    currentScreen = screen(390);
    render("/setup");
    location.pathname = "/";
    popstate?.();
    currentScreen = screen(390);
    expect(render("/").className).toBeTruthy();
    expect(snapshots).toHaveLength(0);
    expect(locked).toBe(false);
  });

  it("cleans up an interrupted slide before another browser navigation", () => {
    currentScreen = screen(390);
    render("/setup");
    location.pathname = "/";
    popstate?.();
    currentScreen = screen(390);
    render("/");
    location.pathname = "/setup";
    popstate?.();
    expect(snapshots[0].remove).toHaveBeenCalledOnce();
    currentScreen = screen(390);
    render("/setup");
    currentScreen.firstElementChild.animate.mock.results[0].value.onfinish?.();
    expect(snapshots[1].remove).toHaveBeenCalledOnce();
    expect(locked).toBe(false);
  });
});

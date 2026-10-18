"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import styles from "./page-transition.module.css";

const COVER_DURATION_MS = 1_150;
const REVEAL_DELAY_MS = 240;
const REVEAL_DURATION_MS = 1_300;
const DEPARTURE_COVER_DURATION_MS = 2_900;
const DEPARTURE_REVEAL_DELAY_MS = 120;
const DEPARTURE_REVEAL_DURATION_MS = 1_200;

type TransitionPhase = "idle" | "covering" | "revealing";
type TransitionKind = "common" | "departure";
type NavigateOptions = { replace?: boolean; origin?: { x: number; y: number } };

type PageTransitionValue = {
  navigate: (href: string, options?: NavigateOptions) => void;
};

const PageTransitionContext = createContext<PageTransitionValue | null>(null);

function visibleScreen(container: HTMLDivElement | null) {
  // Next keeps previous routes in hidden Activity boundaries. DOM order does
  // not identify the active route, even after excluding our snapshot.
  return Array.from(container?.querySelectorAll<HTMLElement>("main:not([aria-hidden='true'])") ?? [])
    .find((screen) => screen.getClientRects().length > 0);
}

export function titleSlideDirection(from: string, to: string) {
  if (from === "/" && to === "/setup") return 1;
  if (from === "/setup" && to === "/") return -1;
  return 0;
}

export function transitionKind(from: string, to: string): TransitionKind {
  return from === "/decided" && to === "/adventure" ? "departure" : "common";
}

export function isTransitionableHref(href: string, currentUrl: string) {
  const current = new URL(currentUrl);
  const target = new URL(href, current);
  if (target.origin !== current.origin) return false;
  return `${target.pathname}${target.search}` !== `${current.pathname}${current.search}`;
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const slide = useRef<{ snapshot: HTMLElement; direction: number; target: string } | null>(null);
  const sliding = useRef(false);
  const finishSlide = useRef<(() => void) | null>(null);
  const [skipTitleIntro, setSkipTitleIntro] = useState(false);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [kind, setKind] = useState<TransitionKind>("common");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const prepareSlide = useCallback((from: string, to: string) => {
    finishSlide.current?.();
    const direction = titleSlideDirection(from, to);
    setSkipTitleIntro(direction === -1);
    const outgoing = visibleScreen(content.current);
    if (!direction || !outgoing || !content.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

    const snapshot = outgoing.cloneNode(true) as HTMLElement;
    // Freeze CSS animations before the live route is replaced.
    const originals = [outgoing, ...outgoing.querySelectorAll("*")];
    const copies = [snapshot, ...snapshot.querySelectorAll("*")];
    originals.forEach((element, index) => {
      const computed = getComputedStyle(element);
      const copy = copies[index] as HTMLElement | SVGElement;
      copy.style.animation = "none";
      // The returned-title class changes on the next navigation. Preserve its
      // completed appearance too, including the hidden opening veil.
      copy.style.display = computed.display;
      copy.style.opacity = computed.opacity;
      copy.style.transform = computed.transform;
      copy.style.filter = computed.filter;
    });
    snapshot.inert = true;
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.style.zIndex = "9999";
    snapshot.style.pointerEvents = "none";
    content.current.appendChild(snapshot);
    slide.current = { snapshot, direction, target: to };
    sliding.current = true;
    // Also release the screen if routing is interrupted before the next commit.
    const release = () => {
      window.clearTimeout(timeout);
      snapshot.remove();
      slide.current = null;
      sliding.current = false;
      finishSlide.current = null;
    };
    const timeout = window.setTimeout(() => finishSlide.current?.(), 10_000);
    finishSlide.current = release;
    return true;
  }, []);

  useEffect(() => {
    // The URL has already changed on popstate; pathname still identifies the
    // screen being displayed. Capture it before Next commits the restored route.
    const onPopState = () => prepareSlide(pathname, window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname, prepareSlide]);

  useLayoutEffect(() => {
    const pending = slide.current;
    // The outgoing snapshot is also a <main> and may precede the new route
    // in DOM order. Never animate that snapshot as the entering screen.
    const incoming = visibleScreen(content.current);
    if (!pending) return;
    if (pathname !== pending.target || !incoming) {
      finishSlide.current?.();
      return;
    }
    const incomingContent = incoming.firstElementChild;
    const outgoingContent = pending.snapshot.firstElementChild;
    if (!incomingContent || !outgoingContent) {
      finishSlide.current?.();
      return;
    }
    // Translate by the actual visible viewport, not the narrow design canvas.
    const distance = incoming.getBoundingClientRect().width;
    const options = { duration: 1_000, easing: "cubic-bezier(0.45, 0, 0.25, 1)", fill: "both" as const };
    // Keep the backdrop stationary so the content feels like one continuous space.
    const background = incoming.animate([
      { backgroundColor: getComputedStyle(pending.snapshot).backgroundColor },
      { backgroundColor: getComputedStyle(incoming).backgroundColor },
    ], options);
    pending.snapshot.style.background = "transparent";
    const outgoingCanvas = pending.snapshot.querySelector<HTMLElement>(".s");
    if (outgoingCanvas) outgoingCanvas.style.background = "transparent";
    const canvasBackground = incoming.querySelector(".s")?.animate([
      { backgroundColor: "transparent" },
      { backgroundColor: "transparent" },
    ], options);
    const enter = incomingContent.animate([
      { transform: `translateX(${pending.direction * distance}px)` },
      { transform: "translateX(0)" },
    ], options);
    const leave = outgoingContent.animate([
      { transform: "translateX(0)" },
      { transform: `translateX(${-pending.direction * distance}px)` },
    ], options);
    // Newly created animations can still have a null startTime. Use the shared
    // document timeline instead of copying that pending value to other tracks.
    const startTime = document.timeline.currentTime;
    if (startTime !== null) {
      for (const animation of [background, canvasBackground, enter, leave]) {
        if (animation) animation.startTime = startTime;
      }
    }
    let finished = false;
    const release = finishSlide.current;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(completionTimeout);
      enter.cancel();
      leave.cancel();
      background.cancel();
      canvasBackground?.cancel();
      release?.();
    };
    // Do not leave navigation blocked when the browser drops a finish event.
    const completionTimeout = window.setTimeout(finish, options.duration + 100);
    finishSlide.current = finish;
    enter.onfinish = finish;
    enter.oncancel = finish;
    return finish;
  }, [pathname]);

  useEffect(() => () => finishSlide.current?.(), []);

  const navigate = useCallback(
    (href: string, options: NavigateOptions = {}) => {
      if (phase !== "idle" || sliding.current) return;
      const target = new URL(href, window.location.href);
      const direction = titleSlideDirection(window.location.pathname, target.pathname);
      if (direction) {
        prepareSlide(window.location.pathname, target.pathname);
        if (options.replace) router.replace(href);
        else router.push(href);
        return;
      }
      setSkipTitleIntro(false);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (options.replace) router.replace(href);
        else router.push(href);
        return;
      }

      const nextKind = transitionKind(window.location.pathname, target.pathname);
      const coverDuration = nextKind === "departure" ? DEPARTURE_COVER_DURATION_MS : COVER_DURATION_MS;
      const revealDelay = nextKind === "departure" ? DEPARTURE_REVEAL_DELAY_MS : REVEAL_DELAY_MS;
      const revealDuration = nextKind === "departure" ? DEPARTURE_REVEAL_DURATION_MS : REVEAL_DURATION_MS;
      setOrigin(options.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setKind(nextKind);
      setPhase("covering");
      timers.current.push(
        window.setTimeout(() => {
          if (options.replace) router.replace(href);
          else router.push(href);
          timers.current.push(window.setTimeout(() => setPhase("revealing"), revealDelay));
        }, coverDuration),
        window.setTimeout(() => setPhase("idle"), coverDuration + revealDelay + revealDuration),
      );
    },
    [phase, router, prepareSlide],
  );

  const value = useMemo(() => ({ navigate }), [navigate]);
  return (
    <PageTransitionContext.Provider value={value}>
      <div ref={content} className={skipTitleIntro ? styles.returnedTitle : undefined}>{children}</div>
      {phase !== "idle" && (
        <div
          className={`${styles.overlay} ${phase === "covering" ? styles.covering : styles.revealing} ${kind === "departure" ? styles.departure : ""}`}
          style={{ "--transition-x": `${origin.x}px`, "--transition-y": `${origin.y}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          {kind === "departure" ? (
            <div className={styles.departureScene}>
              <div className={styles.departureHorizon} />
              <div className={styles.destinationSignal}>
                <span className={styles.destinationCore} />
              </div>
              <svg className={styles.departureTrail} viewBox="0 0 390 844" preserveAspectRatio="none">
                <defs>
                  <clipPath id="departure-light-trail-reveal">
                    <rect className={styles.lightTrailReveal} x="0" y="220" width="390" height="640" />
                  </clipPath>
                </defs>
                <g clipPath="url(#departure-light-trail-reveal)">
                  <path className={styles.lightTrailGlow} d="M195 228 C195 292 235 315 225 362 C211 421 133 427 145 490 C159 561 264 570 242 648 C221 724 133 748 195 860" />
                  <path className={styles.lightTrailCore} d="M195 228 C195 292 235 315 225 362 C211 421 133 427 145 490 C159 561 264 570 242 648 C221 724 133 748 195 860" />
                  <path className={styles.lightTrailHighlight} d="M195 228 C195 292 235 315 225 362 C211 421 133 427 145 490 C159 561 264 570 242 648 C221 724 133 748 195 860" />
                </g>
              </svg>
              <div className={styles.departureLabel}>ROUTE FOUND</div>
            </div>
          ) : (
            <>
              <div className={styles.veil} />
              <div className={styles.portal} />
              <div className={styles.route} />
              <div className={styles.label}>DESTINATION UNKNOWN</div>
            </>
          )}
        </div>
      )}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const value = useContext(PageTransitionContext);
  if (!value) throw new Error("usePageTransition must be used within PageTransitionProvider");
  return value;
}

type TransitionLinkProps = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, target, ...props }: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target === "_blank") return;
    const hrefString = typeof href === "string" ? href : href.pathname ?? "";
    if (!hrefString || !isTransitionableHref(hrefString, window.location.href)) return;
    event.preventDefault();
    navigate(hrefString, { origin: { x: event.clientX, y: event.clientY } });
  }

  return <Link href={href} target={target} onClick={handleClick} {...props} />;
}

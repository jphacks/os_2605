"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import styles from "./page-transition.module.css";

const COVER_DURATION_MS = 1_150;
const REVEAL_DELAY_MS = 240;
const REVEAL_DURATION_MS = 1_300;

type TransitionPhase = "idle" | "covering" | "revealing";
type NavigateOptions = { replace?: boolean; origin?: { x: number; y: number } };

type PageTransitionValue = {
  navigate: (href: string, options?: NavigateOptions) => void;
};

const PageTransitionContext = createContext<PageTransitionValue | null>(null);

export function isTransitionableHref(href: string, currentUrl: string) {
  const current = new URL(currentUrl);
  const target = new URL(href, current);
  if (target.origin !== current.origin) return false;
  return `${target.pathname}${target.search}` !== `${current.pathname}${current.search}`;
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const navigate = useCallback(
    (href: string, options: NavigateOptions = {}) => {
      if (phase !== "idle") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (options.replace) router.replace(href);
        else router.push(href);
        return;
      }

      setOrigin(options.origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setPhase("covering");
      timers.current.push(
        window.setTimeout(() => {
          if (options.replace) router.replace(href);
          else router.push(href);
          timers.current.push(window.setTimeout(() => setPhase("revealing"), REVEAL_DELAY_MS));
        }, COVER_DURATION_MS),
        window.setTimeout(() => setPhase("idle"), COVER_DURATION_MS + REVEAL_DELAY_MS + REVEAL_DURATION_MS),
      );
    },
    [phase, router],
  );

  const value = useMemo(() => ({ navigate }), [navigate]);
  return (
    <PageTransitionContext.Provider value={value}>
      {children}
      {phase !== "idle" && (
        <div
          className={`${styles.overlay} ${phase === "covering" ? styles.covering : styles.revealing}`}
          style={{ "--transition-x": `${origin.x}px`, "--transition-y": `${origin.y}px` } as React.CSSProperties}
          aria-hidden="true"
        >
          <div className={styles.veil} />
          <div className={styles.portal} />
          <div className={styles.route} />
          <div className={styles.label}>DESTINATION UNKNOWN</div>
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

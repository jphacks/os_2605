import type { ReactNode } from "react";
import { TransitionLink } from "@/components/navigation/page-transition";
import { ScreenFrame } from "./screen-frame";

/**
 * 準備前・失敗時の案内。design-ref にない画面のため、既存の配色・文字・ボタンの形だけを使っている。
 */
export function MessageScreen({
  title,
  children,
  primary,
  secondary,
}: {
  title: string;
  children?: ReactNode;
  primary: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href: string };
}) {
  return (
    <ScreenFrame background="var(--ink)" label={title}>
      <div className="logo" style={{ color: "#fff" }}>
        <i>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "currentColor" }}>
            <path d="M5 19 L19 5" />
            <path d="M9 5 H19 V15" />
          </svg>
        </i>
        ミステリップ
      </div>
      <div role="alert" className="abs" style={{ left: "24px", right: "24px", top: "300px", color: "#fff" }}>
        <h1 style={{ fontWeight: 900, fontSize: "30px", lineHeight: 1.3 }}>{title}</h1>
        {children && (
          <p style={{ marginTop: "16px", fontWeight: 700, fontSize: "16px", lineHeight: 1.7, color: "var(--mist)" }}>
            {children}
          </p>
        )}
      </div>
      {secondary && (
        <TransitionLink href={secondary.href} className="abs" style={{ left: "24px", right: "24px", bottom: "128px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: "16px", padding: "12px" }}>
          {secondary.label}
        </TransitionLink>
      )}
      {primary.href ? (
        <TransitionLink href={primary.href} className="cta amber">
          {primary.label}
        </TransitionLink>
      ) : (
        <button type="button" onClick={primary.onClick} className="cta amber">
          {primary.label}
        </button>
      )}
    </ScreenFrame>
  );
}

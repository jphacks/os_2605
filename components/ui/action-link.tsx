import Link from "next/link";
import type { ReactNode } from "react";
export function ActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center gap-4 rounded-xl bg-[#234e3e] px-6 py-4 text-center font-bold text-white transition-colors hover:bg-[#183c32]"
    >
      {children}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}

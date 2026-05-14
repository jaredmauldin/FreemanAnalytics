"use client";

import Link from "next/link";
import { useId } from "react";

type Variant = "header" | "hero";

type Props = {
  /** When set, wraps brand in a link (e.g. `/analytics` in app shell). */
  href?: string;
  variant?: Variant;
  className?: string;
};

/** SVG chart mark + Freeman Analytics wordmark for header, auth, and marketing surfaces. */
export function FreemanBrand({ href, variant = "header", className = "" }: Props) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `fa-mark-grad-${rawId}`;

  const markSize = variant === "hero" ? "h-16 w-16 shrink-0" : "h-9 w-9 shrink-0";
  const titleClass =
    variant === "hero"
      ? "text-2xl font-semibold tracking-tight text-white sm:text-3xl"
      : "text-base font-semibold tracking-tight text-white sm:text-lg";
  const subtitleClass =
    variant === "hero" ? "text-base font-medium tracking-[0.2em] text-blue-300/95" : "text-xs font-semibold tracking-[0.18em] text-blue-300/90";

  const inner = (
    <span className={`flex items-center gap-3 ${variant === "hero" ? "flex-col items-start gap-4 sm:flex-row sm:items-center" : ""}`}>
      <svg className={markSize} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradId})`} />
        <rect x="10" y="22" width="5" height="8" rx="1" fill="white" fillOpacity="0.95" />
        <rect x="17.5" y="16" width="5" height="14" rx="1" fill="white" fillOpacity="0.95" />
        <rect x="25" y="10" width="5" height="20" rx="1" fill="white" fillOpacity="0.95" />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className={titleClass}>Freeman</span>
        <span className={subtitleClass}>ANALYTICS</span>
      </span>
    </span>
  );

  const wrapClass = `group inline-flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e16] ${className}`;

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label="Freeman Analytics — home">
        {inner}
      </Link>
    );
  }

  return (
    <div className={wrapClass} role="img" aria-label="Freeman Analytics">
      {inner}
    </div>
  );
}

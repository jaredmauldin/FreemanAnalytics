"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  isAdmin: boolean;
};

const DATA_LINKS = [
  { href: "/data", label: "Overview" },
  { href: "/data/tor", label: "TOR downtime" },
  { href: "/data/exterior", label: "Exterior alarms" },
  { href: "/data/supervisor-ot", label: "Supervisor OT" },
] as const;

const ANALYTICS_LINKS = [
  { href: "/analytics", label: "Overview" },
  { href: "/analytics/tor", label: "TOR downtime" },
  { href: "/analytics/exterior", label: "Exterior alarms" },
  { href: "/analytics/supervisor-ot", label: "Supervisor OT" },
] as const;

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "View users" },
] as const;

function pathMatchesSection(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function NavDropdown({
  label,
  pathname,
  sectionPrefix,
  links,
}: {
  label: string;
  pathname: string;
  sectionPrefix: string;
  links: readonly { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionActive = pathMatchesSection(pathname, sectionPrefix);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    /** Capture + pointer: reliable on touch/Safari; runs before target handlers so we don’t fight Clerk overlays. */
    function onDoc(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const menuId = sectionPrefix.slice(1).replace(/\//g, "-");

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`submenu-${menuId}`}
        id={`menubutton-${menuId}`}
        onClick={() => setOpen((o) => !o)}
        className={`touch-manipulation flex items-center gap-0.5 rounded-md px-2 py-1 transition-colors ${
          sectionActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
        }`}
      >
        {label}
        <span className="text-[10px] opacity-70" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={`submenu-${menuId}`}
          role="menu"
          aria-labelledby={`menubutton-${menuId}`}
          className="pointer-events-auto absolute left-0 top-[calc(100%+4px)] z-[200] min-w-[220px] rounded-lg border border-[#243041] bg-[#0f1623] py-1 shadow-xl"
        >
          {links.map((item) => {
            const subActive =
              item.href === sectionPrefix
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={close}
                className={`block px-3 py-2 text-sm transition-colors ${
                  subActive ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AppNav({ isAdmin }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="relative isolate flex flex-wrap items-center gap-1 text-sm font-medium" aria-label="Main">
      <NavDropdown label="Data" pathname={pathname} sectionPrefix="/data" links={DATA_LINKS} />
      <NavDropdown label="Analytics" pathname={pathname} sectionPrefix="/analytics" links={ANALYTICS_LINKS} />
      {isAdmin ? <NavDropdown label="Admin" pathname={pathname} sectionPrefix="/admin" links={ADMIN_LINKS} /> : null}
    </nav>
  );
}

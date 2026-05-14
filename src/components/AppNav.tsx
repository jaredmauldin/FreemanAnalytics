"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  isSignedIn: boolean;
  isAdmin: boolean;
};

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active =
    href === "/"
      ? pathname === "/" || pathname === ""
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1 transition-colors ${
        active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppNav({ isSignedIn, isAdmin }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm font-medium" aria-label="Main">
      <NavLink href="/" label="Analytics" pathname={pathname} />
      <NavLink href="/data" label="Data grid" pathname={pathname} />
      {isSignedIn ? (
        <>
          <NavLink href="/dashboard" label="Dashboard" pathname={pathname} />
          {isAdmin ? <NavLink href="/admin" label="Admin" pathname={pathname} /> : null}
        </>
      ) : null}
    </nav>
  );
}

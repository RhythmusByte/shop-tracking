"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile)).catch(() => {});
  }, [pathname]);

  // Close the mobile menu on every navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = [
    ["/", "Dashboard"],
    ["/todo", "Today's TODO"],
    ["/ads", "Ad Campaign"],
    ["/pnl", "PNL"],
    ["/fmo", "FMO Account"],
    ["/export", "Export"],
    ["/stores", "Stores"],
    ...(profile?.role === "admin" ? [["/users", "Users"]] : []),
  ];

  const linkClass = (href) =>
    `px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
      pathname === href
        ? "bg-brand-600 text-white dark:bg-brand-500"
        : "text-slate-600 hover:bg-slate-100 dark:text-brand-200 dark:hover:bg-[#2c2140]"
    }`;

  return (
    <header className="border-b border-slate-200 dark:border-[#3a2a52] bg-white/80 dark:bg-[#1c1428]/80 backdrop-blur-md sticky top-0 z-20 transition-colors duration-200 animate-nav-in">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-slate-800 dark:text-brand-50 shrink-0">Store Tracker</span>
          {/* Desktop link row */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={linkClass(href)}>{label}</Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/settings" className="flex items-center gap-1">
            <Avatar url={profile?.avatarUrl} name={profile?.name} size={28} />
          </Link>
          <button
            onClick={logout}
            className="hidden md:inline text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-brand-100"
          >
            Log out
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-600 dark:text-brand-200 hover:bg-slate-100 dark:hover:bg-[#2c2140]"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#3a2a52] bg-white dark:bg-[#1c1428] animate-slide-down">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-1">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={linkClass(href) + " w-full"}>{label}</Link>
            ))}
            <button
              onClick={logout}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

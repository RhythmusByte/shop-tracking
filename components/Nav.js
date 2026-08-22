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

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile)).catch(() => {});
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
    ["/pnl", "PNL"],
    ["/export", "Export"],
    ["/stores", "Stores"],
  ];

  const link = (href, label) => (
    <Link
      key={href}
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
        pathname === href
          ? "bg-brand-600 text-white dark:bg-brand-500"
          : "text-slate-600 hover:bg-slate-100 dark:text-brand-200 dark:hover:bg-[#2c2140]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-200 dark:border-[#3a2a52] bg-white dark:bg-[#1c1428] sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="font-semibold text-slate-800 dark:text-brand-50 mr-3 shrink-0">Store Tracker</span>
          <div className="flex items-center gap-1 overflow-x-auto">
            {links.map(([href, label]) => link(href, label))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/settings" className="flex items-center gap-1">
            <Avatar url={profile?.avatarUrl} name={profile?.name} size={28} />
          </Link>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-brand-100">
            <span className="hidden sm:inline">Log out</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
}

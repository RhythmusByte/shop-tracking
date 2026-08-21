"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const link = (href, label) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium ${
        pathname === href ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-slate-800 mr-4">Store Tracker</span>
          {link("/", "Dashboard")}
          {link("/todo", "Today's TODO")}
          {link("/pnl", "P&L")}
          {link("/export", "Export")}
          {link("/stores", "Stores")}
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
          Log out
        </button>
      </div>
    </header>
  );
}

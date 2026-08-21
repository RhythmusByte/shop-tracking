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
      className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
        pathname === href ? "bg-white/15 text-white" : "text-purple-100/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="font-semibold text-white mr-3 whitespace-nowrap">Store Tracker</span>
          {link("/", "Dashboard")}
          {link("/todo", "Today's TODO")}
          {link("/pnl", "PNL")}
          {link("/export", "Export")}
          {link("/stores", "Stores")}
        </div>
        <button onClick={logout} className="self-start lg:self-auto text-sm text-purple-100/70 hover:text-white">
          Log out
        </button>
      </div>
    </header>
  );
}

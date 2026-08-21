"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const [stores, setStores] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const date = todayStr();

  useEffect(() => {
    async function load() {
      const [storesRes, entriesRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch(`/api/entries?date=${date}`).then((r) => r.json()),
      ]);
      setStores((storesRes.stores || []).filter((s) => s.active));
      setEntries(entriesRes.entries || []);
      setLoading(false);
    }
    load();
  }, [date]);

  function entryFor(storeId) {
    return entries.find((e) => e.store?._id === storeId);
  }

  function completeness(entry) {
    if (!entry) return 0;
    const checks = [
      entry.openingTime,
      entry.adStartTime,
      entry.stockInTime,
      entry.damagesChecked,
      entry.storeCalled,
      entry.moneyDeposited,
      entry.bankStatementChecked,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <span className="text-sm text-slate-500">{date}</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : stores.length === 0 ? (
        <div className="card">
          <p className="text-sm text-slate-600">
            No stores yet. Add your four stores on the{" "}
            <Link href="/stores" className="text-brand-600 underline">
              Stores
            </Link>{" "}
            page first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => {
            const entry = entryFor(store._id);
            const pct = completeness(entry);
            return (
              <Link
                href={`/store/${store._id}?date=${date}`}
                key={store._id}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-medium text-slate-800">{store.name}</h2>
                  <span className="text-xs text-slate-400">{store.code}</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full ${pct === 100 ? "bg-green-500" : "bg-brand-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mb-3">{pct}% of today's checklist done</p>

                {entry ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-slate-500">Online sales</span>
                    <span className="text-right font-medium">₹{entry.onlineSales ?? 0}</span>
                    <span className="text-slate-500">Offline sales</span>
                    <span className="text-right font-medium">₹{entry.offlineSales ?? 0}</span>
                    <span className="text-slate-500">Money deposited</span>
                    <span className="text-right font-medium">{entry.moneyDeposited ? "Yes" : "No"}</span>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600">No entry logged yet today</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

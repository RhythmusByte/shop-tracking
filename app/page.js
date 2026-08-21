"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { todayStr, yesterdayStr } from "@/lib/date";
import { totalSales, openingStatus, OPENING_STATUS_LABEL, OPENING_STATUS_COLOR } from "@/lib/calc";

export default function DashboardPage() {
  const [stores, setStores] = useState([]);
  const [entries, setEntries] = useState([]);
  const [yesterdayEntries, setYesterdayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const date = todayStr();
  const yDate = yesterdayStr();

  useEffect(() => {
    async function load() {
      const [storesRes, entriesRes, yEntriesRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch(`/api/entries?date=${date}`).then((r) => r.json()),
        fetch(`/api/entries?date=${yDate}`).then((r) => r.json()),
      ]);
      setStores((storesRes.stores || []).filter((s) => s.active));
      setEntries(entriesRes.entries || []);
      setYesterdayEntries(yEntriesRes.entries || []);
      setLoading(false);
    }
    load();
  }, [date, yDate]);

  function entryFor(list, storeId) {
    return list.find((e) => e.store?._id === storeId);
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

  const yesterdayTotal = yesterdayEntries.reduce((sum, e) => sum + totalSales(e), 0);

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
            <Link href="/stores" className="text-brand-600 underline">Stores</Link> page first.
          </p>
        </div>
      ) : (
        <>
          <div className="card mb-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Yesterday's sales ({yDate})</h2>
              <span className="text-lg font-semibold text-slate-800">₹{yesterdayTotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stores.map((store) => {
                const e = entryFor(yesterdayEntries, store._id);
                return (
                  <div key={store._id} className="text-sm">
                    <p className="text-slate-500">{store.code}</p>
                    <p className="font-medium text-slate-800">₹{totalSales(e).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => {
              const entry = entryFor(entries, store._id);
              const pct = completeness(entry);
              const status = openingStatus(store, entry);
              return (
                <Link
                  href={`/store/${store._id}?date=${date}`}
                  key={store._id}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-medium text-slate-800">{store.name}</h2>
                    <div className="flex items-center gap-2">
                      {status !== "unset" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${OPENING_STATUS_COLOR[status]}`}>
                          {OPENING_STATUS_LABEL[status]}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{store.code}</span>
                    </div>
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
                      <span className="text-slate-500">Total sales</span>
                      <span className="text-right font-medium">₹{totalSales(entry).toLocaleString()}</span>
                      <span className="text-slate-500">Expense</span>
                      <span className="text-right font-medium">₹{(entry.totalExpense || 0).toLocaleString()}</span>
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
        </>
      )}
    </div>
  );
}

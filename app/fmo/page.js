"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { todayStr, firstOfMonthStr } from "@/lib/date";
import PageLoader from "@/components/PageLoader";

export default function FmoPage() {
  const [from, setFrom] = useState(firstOfMonthStr());
  const [to, setTo] = useState(todayStr());
  const [stores, setStores] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [storesRes, entriesRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch(`/api/export?from=${from}&to=${to}`).then((r) => r.json()),
    ]);
    setStores((storesRes.stores || []).filter((s) => s.active));
    setEntries(entriesRes.entries || []);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const byStore = stores.map((s) => {
    const storeEntries = entries.filter((e) => e.store?._id === s._id);
    const total = storeEntries.reduce((sum, e) => sum + (e.fmoAccount || 0), 0);
    return { store: s, total, count: storeEntries.filter((e) => e.fmoAccount).length };
  });

  const grandTotal = byStore.reduce((sum, r) => sum + r.total, 0);
  const chartData = byStore.map((r) => ({ name: r.store.code, Amount: r.total }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-1">FMO Account</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Personal-reference figures logged under Bank Statement on each daily entry. Not included in any
        sales, expense, or PNL total.
      </p>

      <div className="card mb-6 animate-fade-in">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading FMO figures" />
      ) : stores.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No active stores yet.</p>
      ) : (
        <>
          <div className="card mb-4 animate-fade-in bg-gradient-to-br from-brand-500 to-purple-600 text-white border-none">
            <p className="text-sm opacity-90">Total across all stores</p>
            <p className="text-3xl font-bold mt-1">₹{grandTotal.toLocaleString()}</p>
          </div>

          <div className="card mb-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">By store</h3>
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#3a2a52]" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="Amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card animate-fade-in">
            <div className="divide-y divide-slate-100 dark:divide-[#3a2a52]">
              {byStore.map((r) => (
                <div key={r.store._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="text-slate-700 dark:text-brand-100 font-medium">{r.store.name}</span>
                    <span className="text-slate-400 dark:text-slate-500"> · {r.count} {r.count === 1 ? "entry" : "entries"}</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-brand-50">₹{r.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

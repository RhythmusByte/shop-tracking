"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, Wallet, Store as StoreIcon, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { todayStr } from "@/lib/date";
import { totalSales, openingStatus, OPENING_STATUS_LABEL, OPENING_STATUS_COLOR } from "@/lib/calc";
import PageLoader from "@/components/PageLoader";

function prevDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const HERO_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
];

export default function DashboardPage() {
  const [date, setDate] = useState(todayStr());
  const [stores, setStores] = useState([]);
  const [entries, setEntries] = useState([]);
  const [expensesByStore, setExpensesByStore] = useState({});
  const [prevEntries, setPrevEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const pDate = prevDay(date);
  const isToday = date === todayStr();

  const load = useCallback(async () => {
    setLoading(true);
    const [storesRes, entriesRes, prevEntriesRes, expensesRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch(`/api/entries?date=${date}`).then((r) => r.json()),
      fetch(`/api/entries?date=${pDate}`).then((r) => r.json()),
      fetch(`/api/expenses?from=${date}&to=${date}`).then((r) => r.json()),
    ]);
    setStores((storesRes.stores || []).filter((s) => s.active));
    setEntries(entriesRes.entries || []);
    setPrevEntries(prevEntriesRes.entries || []);

    const byStore = {};
    for (const ex of expensesRes.expenses || []) {
      const id = ex.store?._id;
      if (!id) continue;
      byStore[id] = (byStore[id] || 0) + ex.amount;
    }
    setExpensesByStore(byStore);
    setLoading(false);
  }, [date, pDate]);

  useEffect(() => {
    load();
  }, [load]);

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

  const prevTotal = prevEntries.reduce((sum, e) => sum + totalSales(e), 0);
  const todayTotal = entries.reduce((sum, e) => sum + totalSales(e), 0);
  const todayExpense = Object.values(expensesByStore).reduce((a, b) => a + b, 0);
  const storesReporting = entries.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(prevDay(date))} className="btn-secondary p-2" aria-label="Previous day">
            <ChevronLeft size={16} />
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
          <button onClick={() => setDate(nextDay(date))} className="btn-secondary p-2" aria-label="Next day">
            <ChevronRight size={16} />
          </button>
          {!isToday && (
            <button onClick={() => setDate(todayStr())} className="text-xs text-brand-600 dark:text-brand-300 hover:underline">
              Today
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading dashboard" />
      ) : stores.length === 0 ? (
        <div className="card">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No stores yet. Add your stores on the{" "}
            <Link href="/stores" className="text-brand-600 dark:text-brand-300 underline">Stores</Link> page first.
          </p>
        </div>
      ) : (
        <>
          {/* Hero stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Total sales"
              value={`₹${todayTotal.toLocaleString()}`}
              gradient="from-violet-500 to-purple-600"
              delay={0}
            />
            <StatCard
              icon={<Wallet size={18} />}
              label="Total expenses"
              value={`₹${todayExpense.toLocaleString()}`}
              gradient="from-amber-500 to-orange-600"
              delay={60}
            />
            <StatCard
              icon={<StoreIcon size={18} />}
              label="Stores reporting"
              value={`${storesReporting}/${stores.length}`}
              gradient="from-indigo-500 to-blue-600"
              delay={120}
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Previous day sales"
              value={`₹${prevTotal.toLocaleString()}`}
              gradient="from-emerald-500 to-teal-600"
              delay={180}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store, i) => {
              const entry = entryFor(entries, store._id);
              const pct = completeness(entry);
              const status = openingStatus(store, entry);
              const expenseTotal = expensesByStore[store._id] || 0;
              const gradient = HERO_GRADIENTS[i % HERO_GRADIENTS.length];
              return (
                <Link
                  href={`/store/${store._id}?date=${date}`}
                  key={store._id}
                  className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 animate-fade-in overflow-hidden relative"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <h2 className="font-medium text-slate-800 dark:text-brand-50">{store.name}</h2>
                    <div className="flex items-center gap-2">
                      {status !== "unset" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${OPENING_STATUS_COLOR[status]}`}>
                          {OPENING_STATUS_LABEL[status]}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">{store.code}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-[#2c2140] rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r transition-all duration-700 ${
                        pct === 100 ? "from-emerald-500 to-green-500" : gradient
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{pct}% of checklist done</p>

                  {entry ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Total sales</span>
                      <span className="text-right font-medium dark:text-brand-50">₹{totalSales(entry).toLocaleString()}</span>
                      <span className="text-slate-500 dark:text-slate-400">Expense</span>
                      <span className="text-right font-medium dark:text-brand-50">₹{expenseTotal.toLocaleString()}</span>
                      <span className="text-slate-500 dark:text-slate-400">Money deposited</span>
                      <span className="text-right font-medium dark:text-brand-50">{entry.moneyDeposited ? "Yes" : "No"}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400">No entry logged for this date</p>
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

function StatCard({ icon, label, value, gradient, delay }) {
  return (
    <div
      className={`stat-card bg-gradient-to-br ${gradient} animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 opacity-90 mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

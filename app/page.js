"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { previousDayStr, todayStr } from "@/lib/date";
import { totalSales, openingStatus, OPENING_STATUS_LABEL, OPENING_STATUS_COLOR } from "@/lib/calc";

const PROFILE_KEY = "store-tracker-user-profile";
const DEFAULT_PROFILE = {
  name: "Admin",
  pfp: "",
};

export default function DashboardPage() {
  const [stores, setStores] = useState([]);
  const [entries, setEntries] = useState([]);
  const [previousEntries, setPreviousEntries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [profileEditing, setProfileEditing] = useState(false);
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);

  const prevDate = previousDayStr(date);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
        setDraftProfile({ ...DEFAULT_PROFILE, ...parsed });
      }
    } catch {
      // Ignore localStorage parse issues and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [storesRes, entriesRes, previousRes, purchasesRes, expensesRes] = await Promise.all([
        fetch("/api/stores").then((r) => r.json()),
        fetch(`/api/entries?date=${date}`).then((r) => r.json()),
        fetch(`/api/entries?date=${prevDate}`).then((r) => r.json()),
        fetch(`/api/purchases?from=${date}&to=${date}`).then((r) => r.json()),
        fetch(`/api/expenses?from=${date}&to=${date}`).then((r) => r.json()),
      ]);
      setStores((storesRes.stores || []).filter((s) => s.active));
      setEntries(entriesRes.entries || []);
      setPreviousEntries(previousRes.entries || []);
      setPurchases(purchasesRes.purchases || []);
      setExpenses(expensesRes.expenses || []);
      setLoading(false);
    }
    load();
  }, [date, prevDate]);

  function entryFor(list, storeId) {
    return list.find((e) => e.store?._id === storeId);
  }

  function storePurchasesTotal(storeId) {
    return purchases
      .filter((purchase) => purchase.store?._id === storeId)
      .reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
  }

  function storeExpensesTotal(storeId) {
    return expenses
      .filter((item) => item.store?._id === storeId)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
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

  const totals = useMemo(() => {
    const sales = entries.reduce((sum, entry) => sum + totalSales(entry), 0);
    const purchaseTotal = purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pnl = sales - purchaseTotal - expenseTotal;
    return { sales, purchaseTotal, expenseTotal, pnl };
  }, [entries, purchases, expenses]);

  const yesterdayTotal = previousEntries.reduce((sum, entry) => sum + totalSales(entry), 0);

  async function saveProfile() {
    const nextProfile = {
      name: draftProfile.name.trim() || DEFAULT_PROFILE.name,
      pfp: draftProfile.pfp.trim(),
    };
    setProfile(nextProfile);
    setProfileEditing(false);
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    } catch {
      // Ignore write failures and keep the in-memory profile.
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-purple-200/70 mb-2">Daily PNL dashboard</p>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-purple-100/70">
            Review any date, compare it with the previous day, and jump straight into each store.
          </p>
        </div>

        <div className="card card-glow w-full lg:max-w-md animate-fade-in">
          <div className="flex items-start gap-3">
            <Avatar name={profile.name} pfp={profile.pfp} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70 mb-1">User profile</p>
              {profileEditing ? (
                <div className="space-y-2">
                  <input
                    className="input"
                    value={draftProfile.name}
                    onChange={(e) => setDraftProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Name"
                  />
                  <input
                    className="input"
                    value={draftProfile.pfp}
                    onChange={(e) => setDraftProfile((p) => ({ ...p, pfp: e.target.value }))}
                    placeholder="PFP URL"
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={saveProfile} type="button">
                      Save user
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setDraftProfile(profile);
                        setProfileEditing(false);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-white">{profile.name}</p>
                    <p className="text-sm text-purple-100/70">Name and profile image are editable locally.</p>
                  </div>
                  <button
                    className="text-sm text-purple-200 hover:text-white"
                    onClick={() => {
                      setDraftProfile(profile);
                      setProfileEditing(true);
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-glow animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70 mb-1">Date focus</p>
            <h2 className="text-xl font-semibold text-white">Select the dashboard date</h2>
          </div>
          <div className="w-full sm:max-w-xs">
            <label className="label">Dashboard date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-purple-100/70">Loading...</p>
      ) : stores.length === 0 ? (
        <div className="card animate-fade-in">
          <p className="text-sm text-slate-600">
            No stores yet. Add your stores on the{" "}
            <Link href="/stores" className="text-brand-500 underline">
              Stores
            </Link>{" "}
            page first.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat label="Sales" value={`₹${totals.sales.toLocaleString()}`} accent />
            <Stat label="Purchases" value={`₹${totals.purchaseTotal.toLocaleString()}`} />
            <Stat label="Expenses" value={`₹${totals.expenseTotal.toLocaleString()}`} />
            <Stat label="PNL" value={`₹${Math.abs(totals.pnl).toLocaleString()}`} negative={totals.pnl < 0} />
          </div>

          <div className="card animate-fade-in">
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Previous day summary ({prevDate})</h2>
              <span className="text-lg font-semibold text-slate-800">₹{yesterdayTotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stores.map((store) => {
                const entry = entryFor(previousEntries, store._id);
                return (
                  <div key={store._id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                    <p className="text-xs text-slate-500">{store.code}</p>
                    <p className="font-semibold text-slate-800">₹{totalSales(entry).toLocaleString()}</p>
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
              const storeSales = totalSales(entry);
              const storePurchaseTotal = storePurchasesTotal(store._id);
              const storeExpenseTotal = storeExpensesTotal(store._id);
              const pnl = storeSales - storePurchaseTotal - storeExpenseTotal;

              return (
                <Link
                  href={`/store/${store._id}?date=${date}`}
                  key={store._id}
                  className="card card-hover animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <h2 className="font-medium text-slate-800">{store.name}</h2>
                      <p className="text-xs text-slate-500">{store.code}</p>
                    </div>
                    {status !== "unset" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${OPENING_STATUS_COLOR[status]}`}>
                        {OPENING_STATUS_LABEL[status]}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${pct === 100 ? "bg-green-500" : "bg-brand-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{pct}% of today's checklist done</p>

                  {entry ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-slate-500">Sales</span>
                        <span className="text-right font-medium">₹{storeSales.toLocaleString()}</span>
                        <span className="text-slate-500">Online / Offline</span>
                        <span className="text-right font-medium">
                          {Number(entry.onlineSales || 0)} / {Number(entry.offlineSales || 0)}
                        </span>
                        <span className="text-slate-500">Expense</span>
                        <span className="text-right font-medium">₹{storeExpenseTotal.toLocaleString()}</span>
                        <span className="text-slate-500">PNL</span>
                        <span className={`text-right font-semibold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ₹{Math.abs(pnl).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Purchases: <span className="font-semibold text-slate-800">₹{storePurchaseTotal.toLocaleString()}</span>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Money deposited: <span className="font-semibold text-slate-800">{entry.moneyDeposited ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600">No entry logged yet on this date</p>
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

function Avatar({ name, pfp }) {
  if (pfp) {
    return <img src={pfp} alt={name || "User"} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/20" />;
  }

  return (
    <div className="h-14 w-14 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-white">
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
        <circle cx="12" cy="8" r="4.5" />
      </svg>
    </div>
  );
}

function Stat({ label, value, accent, negative }) {
  return (
    <div className={`card ${accent ? "card-glow" : ""} animate-fade-in`}>
      <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${negative ? "text-red-100" : "text-white"}`}>{value}</p>
    </div>
  );
}

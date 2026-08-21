"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { totalSales } from "@/lib/calc";
import { todayStr, firstOfMonthStr } from "@/lib/date";

export default function PnlPage() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState(firstOfMonthStr());
  const [to, setTo] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.stores || []).filter((s) => s.active);
        setStores(active);
        if (active.length > 0) setStoreId(active[0]._id);
      });
  }, []);

  async function generate() {
    if (!storeId) return;
    setLoading(true);
    setRan(true);
    const [entriesRes, purchasesRes, expensesRes] = await Promise.all([
      fetch(`/api/export?from=${from}&to=${to}&store=${storeId}`).then((r) => r.json()),
      fetch(`/api/purchases?store=${storeId}&from=${from}&to=${to}`).then((r) => r.json()),
      fetch(`/api/expenses?store=${storeId}&from=${from}&to=${to}`).then((r) => r.json()),
    ]);
    setEntries(entriesRes.entries || []);
    setPurchases(purchasesRes.purchases || []);
    setExpenses(expensesRes.expenses || []);
    setLoading(false);
  }

  const totalSalesAmt = useMemo(() => entries.reduce((sum, entry) => sum + totalSales(entry), 0), [entries]);
  const totalPurchaseAmt = useMemo(() => purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0), [purchases]);
  const totalExpenseAmt = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0), [expenses]);
  const pnl = totalSalesAmt - totalPurchaseAmt - totalExpenseAmt;
  const currentStore = stores.find((s) => s._id === storeId);

  function exportPnl() {
    const wb = XLSX.utils.book_new();

    const summary = [
      { Metric: "Store", Value: currentStore?.name || "" },
      { Metric: "Period", Value: `${from} to ${to}` },
      { Metric: "Total Sales", Value: totalSalesAmt },
      { Metric: "Total Purchases", Value: totalPurchaseAmt },
      { Metric: "Total Expenses", Value: totalExpenseAmt },
      { Metric: "PNL", Value: pnl },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");

    const dailyRows = entries.map((entry) => ({
      Date: entry.date,
      "Total Sales": totalSales(entry),
      Expense: entry.totalExpense || 0,
      "Online Count": entry.onlineSales || 0,
      "Offline Count": entry.offlineSales || 0,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), "Daily PNL");

    const purchaseRows = purchases.map((purchase) => ({
      Date: purchase.date,
      Description: purchase.description,
      Vendor: purchase.vendor,
      Notes: purchase.notes,
      Amount: purchase.amount,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseRows), "Purchases");

    const expenseRows = expenses.map((expense) => ({
      Date: expense.date,
      Description: expense.description,
      Notes: expense.notes,
      Amount: expense.amount,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), "Expenses");

    XLSX.writeFile(wb, `PNL_${currentStore?.code || "store"}_${from}_to_${to}.xlsx`);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-purple-200/70 mb-2">Profit dashboard</p>
        <h1 className="text-3xl font-semibold text-white">PNL Generator</h1>
      </div>

      <div className="card card-glow animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Store</label>
            <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <button onClick={generate} disabled={loading || !storeId} className="btn-primary">
          {loading ? "Generating..." : "Generate PNL"}
        </button>
      </div>

      {ran && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Metric label="Sales" value={`₹${totalSalesAmt.toLocaleString()}`} accent />
            <Metric label="Purchases" value={`₹${totalPurchaseAmt.toLocaleString()}`} />
            <Metric label="Expenses" value={`₹${totalExpenseAmt.toLocaleString()}`} />
            <Metric label="PNL" value={`₹${Math.abs(pnl).toLocaleString()}`} negative={pnl < 0} />
          </div>

          <div className="card animate-fade-in">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              {currentStore?.name} · {from} to {to}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Row label="Total sales" value={totalSalesAmt} />
              <Row label="Total purchases" value={totalPurchaseAmt} negative />
              <Row label="Total expenses" value={totalExpenseAmt} negative />
              <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-800 md:col-span-2">
                <span>PNL</span>
                <span className={pnl >= 0 ? "text-green-600" : "text-red-600"}>
                  ₹{Math.abs(pnl).toLocaleString()}
                </span>
              </div>
            </div>
            <button onClick={exportPnl} className="btn-secondary mt-4">
              Export as spreadsheet
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, accent, negative }) {
  return (
    <div className={`card ${accent ? "card-glow" : ""} animate-fade-in`}>
      <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${negative ? "text-red-100" : "text-white"}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, negative }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">
        {negative ? "− " : ""}₹{value.toLocaleString()}
      </span>
    </div>
  );
}

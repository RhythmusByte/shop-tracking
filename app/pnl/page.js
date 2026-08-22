"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { totalSales } from "@/lib/calc";
import { todayStr, firstOfMonthStr } from "@/lib/date";

const CHART_COLORS = { sales: "#8b5cf6", expense: "#f59e0b", purchase: "#ef4444", net: "#22c55e" };

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
    fetch("/api/stores").then((r) => r.json()).then((d) => {
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

  const totalSalesAmt = entries.reduce((sum, e) => sum + totalSales(e), 0);
  const totalExpenseAmt = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchaseAmt = purchases.reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalSalesAmt - totalExpenseAmt - totalPurchaseAmt;

  const currentStore = stores.find((s) => s._id === storeId);

  // Build a per-date series merging sales, expenses, purchases for the chart.
  const dateSet = new Set([
    ...entries.map((e) => e.date),
    ...expenses.map((e) => e.date),
    ...purchases.map((p) => p.date),
  ]);
  const chartData = Array.from(dateSet)
    .sort()
    .map((date) => {
      const dayEntry = entries.find((e) => e.date === date);
      const dayExpense = expenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);
      const dayPurchase = purchases.filter((p) => p.date === date).reduce((s, p) => s + p.amount, 0);
      const daySales = totalSales(dayEntry);
      return {
        date: date.slice(5), // MM-DD, shorter axis labels
        Sales: daySales,
        Expense: dayExpense,
        Purchase: dayPurchase,
        Net: daySales - dayExpense - dayPurchase,
      };
    });

  function exportPnl() {
    const wb = XLSX.utils.book_new();

    const summary = [
      { Metric: "Store", Value: currentStore?.name || "" },
      { Metric: "Period", Value: `${from} to ${to}` },
      { Metric: "Total Sales", Value: totalSalesAmt },
      { Metric: "Total Purchases", Value: totalPurchaseAmt },
      { Metric: "Total Expenses", Value: totalExpenseAmt },
      { Metric: "Net Profit / Loss", Value: netProfit },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");

    const dailyRows = entries.map((e) => ({ Date: e.date, "Total Sales": totalSales(e) }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), "Daily Sales");

    const expenseRows = expenses.map((e) => ({ Date: e.date, Description: e.description, Amount: e.amount, Notes: e.notes }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), "Expenses");

    const purchaseRows = purchases.map((p) => ({ Date: p.date, Description: p.description, Vendor: p.vendor, Amount: p.amount }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseRows), "Purchases");

    XLSX.writeFile(wb, `PNL_${currentStore?.code || "store"}_${from}_to_${to}.xlsx`);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-5">PNL Generator</h1>

      <div className="card mb-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="label">Store</label>
            <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
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
        <div className="space-y-4 animate-fade-in">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">
              {currentStore?.name} · {from} to {to}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              <Stat label="Sales" value={totalSalesAmt} color="text-brand-600 dark:text-brand-300" />
              <Stat label="Expenses" value={totalExpenseAmt} color="text-amber-600 dark:text-amber-400" />
              <Stat label="Purchases" value={totalPurchaseAmt} color="text-red-600 dark:text-red-400" />
              <Stat
                label={netProfit >= 0 ? "Net profit" : "Net loss"}
                value={Math.abs(netProfit)}
                color={netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
              />
            </div>
          </div>

          {chartData.length > 0 && (
            <>
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">Sales vs expenses vs purchases</h3>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#3a2a52]" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Sales" fill={CHART_COLORS.sales} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Purchase" fill={CHART_COLORS.purchase} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">Net profit / loss trend</h3>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#3a2a52]" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Line type="monotone" dataKey="Net" stroke={CHART_COLORS.net} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          <button onClick={exportPnl} className="btn-secondary">Export as spreadsheet</button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>₹{value.toLocaleString()}</p>
    </div>
  );
}

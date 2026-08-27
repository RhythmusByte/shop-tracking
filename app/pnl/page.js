"use client";

import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { addStyledSheet, downloadWorkbook } from "@/lib/exportSheet";
import { totalSales, categorizeExpense, EXPENSE_CATEGORY_LABEL, EXPENSE_CATEGORY_COLOR, formatMoney } from "@/lib/calc";
import { todayStr, firstOfMonthStr, formatDM, formatDMY } from "@/lib/date";
import CountUp from "@/components/CountUp";
import PageLoader from "@/components/PageLoader";

const CHART_COLORS = { sales: "#8b5cf6", expense: "#f59e0b", purchase: "#ef4444", net: "#22c55e", online: "#6366f1", offline: "#ec4899" };
const CHART_ANIM = { animationDuration: 700, animationEasing: "ease-out" };

export default function PnlPage() {
  const [view, setView] = useState("single"); // "single" | "compare"
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState(firstOfMonthStr());
  const [to, setTo] = useState(todayStr());

  const [entries, setEntries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const [compareData, setCompareData] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareRan, setCompareRan] = useState(false);

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

  async function generateCompare() {
    setCompareLoading(true);
    setCompareRan(true);
    const [entriesRes, purchasesRes, expensesRes] = await Promise.all([
      fetch(`/api/export?from=${from}&to=${to}`).then((r) => r.json()),
      fetch(`/api/purchases?from=${from}&to=${to}`).then((r) => r.json()),
      fetch(`/api/expenses?from=${from}&to=${to}`).then((r) => r.json()),
    ]);
    const allEntries = entriesRes.entries || [];
    const allPurchases = purchasesRes.purchases || [];
    const allExpenses = expensesRes.expenses || [];

    const rows = stores.map((s) => {
      const sEntries = allEntries.filter((e) => e.store?._id === s._id);
      const sExpenses = allExpenses.filter((e) => e.store?._id === s._id);
      const sPurchases = allPurchases.filter((p) => p.store?._id === s._id);
      const sales = sEntries.reduce((sum, e) => sum + totalSales(e), 0);
      const expenseTotal = sExpenses.reduce((sum, e) => sum + e.amount, 0);
      const purchaseTotal = sPurchases.reduce((sum, p) => sum + p.amount, 0);
      return {
        name: s.code,
        fullName: s.name,
        Sales: sales,
        Expenses: expenseTotal,
        Purchases: purchaseTotal,
        Net: sales - expenseTotal - purchaseTotal,
      };
    });
    setCompareData(rows);
    setCompareLoading(false);
  }

  const totalSalesAmt = entries.reduce((sum, e) => sum + totalSales(e), 0);
  const totalExpenseAmt = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPurchaseAmt = purchases.reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalSalesAmt - totalExpenseAmt - totalPurchaseAmt;

  const currentStore = stores.find((s) => s._id === storeId);

  // Expense category breakdown (Salary is a real field; Petrol/Food/Profit
  // are keyword-matched from the description; everything else is General).
  const categoryTotals = { salary: 0, petrol: 0, food: 0, profit: 0, general: 0 };
  for (const e of expenses) categoryTotals[categorizeExpense(e)] += e.amount;
  const categoryChartData = Object.entries(categoryTotals)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({ name: EXPENSE_CATEGORY_LABEL[key], value: amount, key }));

  // Salary paid per staff member, scoped to the selected date range.
  const salaryByStaff = {};
  for (const e of expenses) {
    if (categorizeExpense(e) !== "salary") continue;
    const name = e.staff?.name || "Unassigned";
    salaryByStaff[name] = (salaryByStaff[name] || 0) + e.amount;
  }
  const salaryRows = Object.entries(salaryByStaff).sort((a, b) => b[1] - a[1]);

  // Online vs offline order counts, per day.
  const onlineOfflineData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: formatDM(e.date),
      Online: e.onlineSalesCount || 0,
      Offline: e.offlineSalesCount || 0,
    }));

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
        date: formatDM(date),
        Sales: daySales,
        Expense: dayExpense,
        Purchase: dayPurchase,
        Net: daySales - dayExpense - dayPurchase,
      };
    });

  const MONEY_FMT = "₹#,##0.00";

  async function exportPnl() {
    const wb = new ExcelJS.Workbook();
    const subtitle = `${formatDMY(from)} to ${formatDMY(to)}`;
    const storeName = currentStore?.name || "Store";

    addStyledSheet(wb, {
      sheetName: "Summary",
      title: `${storeName} — PNL Summary`,
      subtitle,
      columns: [
        { header: "Metric", key: "metric", width: 24 },
        { header: "Value", key: "value", width: 18, numFmt: MONEY_FMT },
      ],
      rows: [
        { metric: "Total Sales", value: totalSalesAmt },
        { metric: "Total Purchases", value: totalPurchaseAmt },
        { metric: "Total Expenses", value: totalExpenseAmt },
        { metric: netProfit >= 0 ? "Net Profit" : "Net Loss", value: Math.abs(netProfit) },
      ],
    });

    addStyledSheet(wb, {
      sheetName: "Expense Categories",
      title: `${storeName} — Expense Categories`,
      subtitle,
      columns: [
        { header: "Category", key: "category", width: 22 },
        { header: "Amount", key: "amount", width: 16, numFmt: MONEY_FMT },
      ],
      rows: Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .map(([key, amount]) => ({ category: EXPENSE_CATEGORY_LABEL[key], amount })),
    });

    if (salaryRows.length > 0) {
      addStyledSheet(wb, {
        sheetName: "Salary by Staff",
        title: `${storeName} — Salary by Staff`,
        subtitle,
        columns: [
          { header: "Staff", key: "staff", width: 22 },
          { header: "Salary Paid", key: "amount", width: 16, numFmt: MONEY_FMT },
        ],
        rows: salaryRows.map(([name, amount]) => ({ staff: name, amount })),
      });
    }

    addStyledSheet(wb, {
      sheetName: "Daily Sales",
      title: `${storeName} — Daily Sales`,
      subtitle,
      columns: [
        { header: "Date", key: "date", width: 12 },
        { header: "Total Sales", key: "totalSales", width: 16, numFmt: MONEY_FMT },
      ],
      rows: entries.map((e) => ({ date: formatDMY(e.date), totalSales: totalSales(e) })),
    });

    addStyledSheet(wb, {
      sheetName: "Expenses",
      title: `${storeName} — Expenses`,
      subtitle,
      columns: [
        { header: "Date", key: "date", width: 12 },
        { header: "Description", key: "description", width: 28 },
        { header: "Amount", key: "amount", width: 14, numFmt: MONEY_FMT },
        { header: "Notes", key: "notes", width: 24 },
      ],
      rows: expenses.map((e) => ({ date: formatDMY(e.date), description: e.description, amount: e.amount, notes: e.notes || "" })),
    });

    addStyledSheet(wb, {
      sheetName: "Purchases",
      title: `${storeName} — Purchases`,
      subtitle,
      columns: [
        { header: "Date", key: "date", width: 12 },
        { header: "Description", key: "description", width: 28 },
        { header: "Vendor", key: "vendor", width: 18 },
        { header: "Amount", key: "amount", width: 14, numFmt: MONEY_FMT },
      ],
      rows: purchases.map((p) => ({ date: formatDMY(p.date), description: p.description, vendor: p.vendor || "", amount: p.amount })),
    });

    await downloadWorkbook(wb, `PNL_${currentStore?.code || "store"}_${from}_to_${to}.xlsx`);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50">PNL Generator</h1>
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#3a2a52] p-1 bg-white/50 dark:bg-[#1c1428]/50">
          <button
            onClick={() => setView("single")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
              view === "single" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Single store
          </button>
          <button
            onClick={() => setView("compare")}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 ${
              view === "compare" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Compare all stores
          </button>
        </div>
      </div>

      {view === "single" ? (
        <>
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

          {loading ? (
            <PageLoader label="Crunching the numbers" />
          ) : ran && (
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

              {salaryRows.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">Salary paid, by staff</h3>
                  <div className="divide-y divide-slate-100 dark:divide-[#3a2a52]">
                    {salaryRows.map(([name, amount]) => (
                      <div key={name} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-slate-700 dark:text-brand-100">{name}</span>
                        <span className="font-semibold text-slate-800 dark:text-brand-50">
                          <CountUp value={amount} prefix="₹" decimals={2} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryChartData.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">Expense breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            {...CHART_ANIM}
                          >
                            {categoryChartData.map((entry) => (
                              <Cell key={entry.key} fill={EXPENSE_CATEGORY_COLOR[entry.key]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {categoryChartData.map((c) => (
                        <div key={c.key} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-brand-200">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPENSE_CATEGORY_COLOR[c.key] }} />
                            {c.name}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-brand-50">{formatMoney(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onlineOfflineData.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">Online vs offline orders</h3>
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <BarChart data={onlineOfflineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#3a2a52]" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Online" fill={CHART_COLORS.online} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                        <Bar dataKey="Offline" fill={CHART_COLORS.offline} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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
                          <Bar dataKey="Sales" fill={CHART_COLORS.sales} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                          <Bar dataKey="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                          <Bar dataKey="Purchase" fill={CHART_COLORS.purchase} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
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
                          <Line type="monotone" dataKey="Net" stroke={CHART_COLORS.net} strokeWidth={2} dot={false} {...CHART_ANIM} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              <button onClick={exportPnl} className="btn-secondary">Export as spreadsheet</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card mb-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <button onClick={generateCompare} disabled={compareLoading} className="btn-primary">
              {compareLoading ? "Comparing..." : "Compare stores"}
            </button>
          </div>

          {compareLoading ? (
            <PageLoader label="Comparing stores" />
          ) : compareRan && (
            <div className="space-y-4 animate-fade-in">
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-4">
                  All stores · {from} to {to}
                </h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={compareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#3a2a52]" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Sales" fill={CHART_COLORS.sales} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      <Bar dataKey="Expenses" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      <Bar dataKey="Purchases" fill={CHART_COLORS.purchase} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                      <Bar dataKey="Net" fill={CHART_COLORS.net} radius={[4, 4, 0, 0]} {...CHART_ANIM} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="divide-y divide-slate-100 dark:divide-[#3a2a52]">
                  {compareData.map((row) => (
                    <div key={row.name} className="grid grid-cols-5 gap-2 py-2 text-sm items-center">
                      <span className="font-medium text-slate-800 dark:text-brand-50">{row.fullName}</span>
                      <span className="text-right text-slate-600 dark:text-brand-200">{formatMoney(row.Sales)}</span>
                      <span className="text-right text-slate-600 dark:text-brand-200">{formatMoney(row.Expenses)}</span>
                      <span className="text-right text-slate-600 dark:text-brand-200">{formatMoney(row.Purchases)}</span>
                      <span className={`text-right font-semibold ${row.Net >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatMoney(row.Net)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>
        <CountUp value={value} prefix="₹" decimals={2} />
      </p>
    </div>
  );
}

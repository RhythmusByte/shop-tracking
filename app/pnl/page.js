"use client";

import { useEffect, useState } from "react";
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
    const [entriesRes, purchasesRes] = await Promise.all([
      fetch(`/api/export?from=${from}&to=${to}&store=${storeId}`).then((r) => r.json()),
      fetch(`/api/purchases?store=${storeId}&from=${from}&to=${to}`).then((r) => r.json()),
    ]);
    setEntries(entriesRes.entries || []);
    setPurchases(purchasesRes.purchases || []);
    setLoading(false);
  }

  const totalSalesAmt = entries.reduce((sum, e) => sum + totalSales(e), 0);
  const totalExpenseAmt = entries.reduce((sum, e) => sum + (e.totalExpense || 0), 0);
  const totalPurchaseAmt = purchases.reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalSalesAmt - totalExpenseAmt - totalPurchaseAmt;

  const currentStore = stores.find((s) => s._id === storeId);

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
    const summaryWs = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    const dailyRows = entries.map((e) => ({
      Date: e.date,
      "Total Sales": totalSales(e),
      Expense: e.totalExpense || 0,
    }));
    const dailyWs = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Sales");

    const purchaseRows = purchases.map((p) => ({
      Date: p.date,
      Description: p.description,
      Vendor: p.vendor,
      Amount: p.amount,
    }));
    const purchaseWs = XLSX.utils.json_to_sheet(purchaseRows);
    XLSX.utils.book_append_sheet(wb, purchaseWs, "Purchases");

    XLSX.writeFile(wb, `PNL_${currentStore?.code || "store"}_${from}_to_${to}.xlsx`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-5">P&amp;L Generator</h1>

      <div className="card mb-6">
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
          {loading ? "Generating..." : "Generate P&L"}
        </button>
      </div>

      {ran && !loading && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {currentStore?.name} · {from} to {to}
          </h3>
          <div className="space-y-2 text-sm mb-4">
            <Row label="Total sales" value={totalSalesAmt} />
            <Row label="Total purchases" value={totalPurchaseAmt} negative />
            <Row label="Total expenses" value={totalExpenseAmt} negative />
            <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-800">
              <span>Net {netProfit >= 0 ? "profit" : "loss"}</span>
              <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                ₹{Math.abs(netProfit).toLocaleString()}
              </span>
            </div>
          </div>
          <button onClick={exportPnl} className="btn-secondary">Export as spreadsheet</button>
        </div>
      )}
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

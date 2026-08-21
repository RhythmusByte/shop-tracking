"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { totalSales } from "@/lib/calc";
import { todayStr, firstOfMonthStr } from "@/lib/date";

function firstOfMonth() {
  return firstOfMonthStr();
}

const COLUMNS = [
  ["date", "Date"],
  ["storeName", "Store"],
  ["storeCode", "Code"],
  ["onlineSales", "Online Sales"],
  ["offlineSales", "Offline Sales"],
  ["cashSales", "Cash"],
  ["upiSales", "UPI"],
  ["cardSales", "Card"],
  ["creditSales", "Credit"],
  ["totalSale", "Total Sale"],
  ["totalExpense", "Total Expense"],
  ["adStartTime", "Ad Start Time"],
  ["adStartedOnTime", "Ad On Time (6AM)"],
  ["adConversions", "Ad Conversions (count)"],
  ["openingTime", "Opening Time"],
  ["stockInTime", "Stock In Time"],
  ["stockInNotes", "Stock In Notes"],
  ["stockLeftChecked", "Stock Left Checked"],
  ["stockLeftNotes", "Stock Left Notes"],
  ["bankStatementChecked", "Bank Statement Checked"],
  ["bankCreditedBy12PM", "Credited By 12PM"],
  ["fmoAccountAmount", "FMO Account Amount"],
  ["damagesChecked", "Damages Checked"],
  ["damagesFound", "Damages Found"],
  ["damagesNotes", "Damages Notes"],
  ["storeCalled", "Store Called"],
  ["moneyDeposited", "Money Deposited"],
  ["notes", "Notes"],
];

function toRow(entry) {
  const row = {};
  for (const [key, label] of COLUMNS) {
    let value;
    if (key === "storeName") value = entry.store?.name ?? "";
    else if (key === "storeCode") value = entry.store?.code ?? "";
    else if (key === "totalSale") value = totalSales(entry);
    else value = entry[key];
    if (typeof value === "boolean") value = value ? "Yes" : "No";
    row[label] = value ?? "";
  }
  return row;
}

export default function ExportPage() {
  const [stores, setStores] = useState([]);
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/stores").then((r) => r.json()).then((d) => setStores(d.stores || []));
  }, []);

  async function fetchEntries(storeId) {
    const qs = new URLSearchParams({ from, to });
    if (storeId) qs.set("store", storeId);
    const res = await fetch(`/api/export?${qs.toString()}`).then((r) => r.json());
    return res.entries || [];
  }

  async function exportAllStoresCombined() {
    setBusy(true);
    setMessage("");
    try {
      const entries = await fetchEntries();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(entries.map(toRow));
      XLSX.utils.book_append_sheet(wb, ws, "All Stores");
      XLSX.writeFile(wb, `all-stores_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function exportPerStoreWorkbook() {
    setBusy(true);
    setMessage("");
    try {
      const wb = XLSX.utils.book_new();
      for (const store of stores) {
        const entries = await fetchEntries(store._id);
        const ws = XLSX.utils.json_to_sheet(entries.map(toRow));
        // Sheet names are capped at 31 chars by the xlsx format.
        XLSX.utils.book_append_sheet(wb, ws, store.code.slice(0, 31));
      }
      XLSX.writeFile(wb, `by-store_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function exportSingleStore(storeId, storeCode) {
    setBusy(true);
    setMessage("");
    try {
      const entries = await fetchEntries(storeId);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(entries.map(toRow));
      XLSX.utils.book_append_sheet(wb, ws, storeCode.slice(0, 31));
      XLSX.writeFile(wb, `${storeCode}_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold text-white mb-5">Export to spreadsheet</h1>

      <div className="card card-glow mb-6 animate-fade-in">
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

        <div className="flex flex-wrap gap-3">
          <button onClick={exportAllStoresCombined} disabled={busy} className="btn-primary">
            All stores (one sheet)
          </button>
          <button onClick={exportPerStoreWorkbook} disabled={busy} className="btn-secondary">
            All stores (one tab each)
          </button>
        </div>
      </div>

      <div className="card animate-fade-in">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Export a single store</h3>
        <div className="space-y-2">
          {stores.map((s) => (
            <div key={s._id} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{s.name} ({s.code})</span>
              <button
                onClick={() => exportSingleStore(s._id, s.code)}
                disabled={busy}
                className="text-sm text-brand-600 hover:underline"
              >
                Export
              </button>
            </div>
          ))}
          {stores.length === 0 && <p className="text-sm text-slate-500">No stores yet.</p>}
        </div>
      </div>

      {message && <p className="text-sm text-slate-500 mt-3">{message}</p>}
    </div>
  );
}

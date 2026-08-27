"use client";

import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { addStyledSheet, downloadWorkbook } from "@/lib/exportSheet";
import { totalSales } from "@/lib/calc";
import { todayStr, firstOfMonthStr, formatDMY } from "@/lib/date";

const MONEY_FMT = "₹#,##0.00";
const KG_FMT = "0.00 \"kg\"";

const COLUMNS = [
  { header: "Date", key: "date", width: 12 },
  { header: "Store", key: "storeName", width: 22 },
  { header: "Code", key: "storeCode", width: 8 },
  { header: "Online Orders", key: "onlineSalesCount", width: 12 },
  { header: "Offline Orders", key: "offlineSalesCount", width: 12 },
  { header: "Cash", key: "cashSales", width: 12, numFmt: MONEY_FMT },
  { header: "UPI", key: "upiSales", width: 12, numFmt: MONEY_FMT },
  { header: "Card", key: "cardSales", width: 12, numFmt: MONEY_FMT },
  { header: "Credit", key: "creditSales", width: 12, numFmt: MONEY_FMT },
  { header: "Total Sale", key: "totalSale", width: 14, numFmt: MONEY_FMT },
  { header: "Opening", key: "openingStatus", width: 14 },
  { header: "Stock In Time", key: "stockInTime", width: 12 },
  { header: "Received (kg)", key: "stockReceivedKg", width: 13, numFmt: KG_FMT },
  { header: "Damaged (kg)", key: "damagedKg", width: 13, numFmt: KG_FMT },
  { header: "Wastage (kg)", key: "wastageKg", width: 13, numFmt: KG_FMT },
  { header: "Left for Tomorrow (kg)", key: "stockLeftForTomorrowKg", width: 16, numFmt: KG_FMT },
  { header: "FMO Deposited", key: "fmoAccount", width: 14, numFmt: MONEY_FMT },
  { header: "Receipt Confirmed", key: "receiptConfirmed", width: 15 },
  { header: "UPI/Card Cross-Checked", key: "upiCardCrossChecked", width: 18 },
  { header: "Notes", key: "notes", width: 30 },
];

function toRow(entry) {
  return {
    date: formatDMY(entry.date),
    storeName: entry.store?.name ?? "",
    storeCode: entry.store?.code ?? "",
    onlineSalesCount: entry.onlineSalesCount || 0,
    offlineSalesCount: entry.offlineSalesCount || 0,
    cashSales: entry.cashSales || 0,
    upiSales: entry.upiSales || 0,
    cardSales: entry.cardSales || 0,
    creditSales: entry.creditSales || 0,
    totalSale: totalSales(entry),
    openingStatus: entry.storeClosedToday ? "Closed" : entry.openingTime || "Not logged",
    stockInTime: entry.stockInTime || "",
    stockReceivedKg: entry.stockReceivedKg || 0,
    damagedKg: entry.damagedKg || 0,
    wastageKg: entry.wastageKg || 0,
    stockLeftForTomorrowKg: entry.stockLeftForTomorrowKg || 0,
    fmoAccount: entry.fmoAccount || 0,
    receiptConfirmed: entry.receiptConfirmed ? "Yes" : "No",
    upiCardCrossChecked: entry.upiCardCrossChecked ? "Yes" : "No",
    notes: entry.notes || "",
  };
}

const EXPENSE_COLUMNS = [
  { header: "Date", key: "date", width: 12 },
  { header: "Store", key: "storeName", width: 22 },
  { header: "Description", key: "description", width: 28 },
  { header: "Amount", key: "amount", width: 14, numFmt: MONEY_FMT },
  { header: "Notes", key: "notes", width: 24 },
];

function expenseRow(e) {
  return {
    date: formatDMY(e.date),
    storeName: e.store?.name ?? "",
    description: e.description,
    amount: e.amount,
    notes: e.notes || "",
  };
}

export default function ExportPage() {
  const [stores, setStores] = useState([]);
  const [from, setFrom] = useState(firstOfMonthStr());
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

  async function fetchExpenses(storeId) {
    const qs = new URLSearchParams({ from, to });
    if (storeId) qs.set("store", storeId);
    const res = await fetch(`/api/expenses?${qs.toString()}`).then((r) => r.json());
    return res.expenses || [];
  }

  async function exportAllStoresCombined() {
    setBusy(true);
    setMessage("");
    try {
      const [entries, expenses] = await Promise.all([fetchEntries(), fetchExpenses()]);
      const wb = new ExcelJS.Workbook();
      const subtitle = `${formatDMY(from)} to ${formatDMY(to)}`;
      addStyledSheet(wb, {
        sheetName: "All Stores",
        title: "Store Tracker — All Stores Daily Report",
        subtitle,
        columns: COLUMNS,
        rows: entries.map(toRow),
      });
      addStyledSheet(wb, {
        sheetName: "Expenses",
        title: "Store Tracker — Expenses",
        subtitle,
        columns: EXPENSE_COLUMNS,
        rows: expenses.map(expenseRow),
      });
      await downloadWorkbook(wb, `all-stores_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function exportPerStoreWorkbook() {
    setBusy(true);
    setMessage("");
    try {
      const wb = new ExcelJS.Workbook();
      const subtitle = `${formatDMY(from)} to ${formatDMY(to)}`;
      for (const store of stores) {
        const entries = await fetchEntries(store._id);
        addStyledSheet(wb, {
          sheetName: store.code,
          title: `${store.name} — Daily Report`,
          subtitle,
          columns: COLUMNS,
          rows: entries.map(toRow),
        });
      }
      await downloadWorkbook(wb, `by-store_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function exportSingleStore(storeId, storeCode, storeName) {
    setBusy(true);
    setMessage("");
    try {
      const [entries, expenses] = await Promise.all([fetchEntries(storeId), fetchExpenses(storeId)]);
      const wb = new ExcelJS.Workbook();
      const subtitle = `${formatDMY(from)} to ${formatDMY(to)}`;
      addStyledSheet(wb, {
        sheetName: storeCode,
        title: `${storeName} — Daily Report`,
        subtitle,
        columns: COLUMNS,
        rows: entries.map(toRow),
      });
      addStyledSheet(wb, {
        sheetName: "Expenses",
        title: `${storeName} — Expenses`,
        subtitle,
        columns: EXPENSE_COLUMNS,
        rows: expenses.map(expenseRow),
      });
      await downloadWorkbook(wb, `${storeCode}_${from}_to_${to}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-5">Export to spreadsheet</h1>

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
        <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">Export a single store</h3>
        <div className="space-y-2">
          {stores.map((s) => (
            <div key={s._id} className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-brand-100">{s.name} ({s.code})</span>
              <button
                onClick={() => exportSingleStore(s._id, s.code, s.name)}
                disabled={busy}
                className="text-sm text-brand-600 dark:text-brand-300 hover:underline"
              >
                Export
              </button>
            </div>
          ))}
          {stores.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No stores yet.</p>}
        </div>
      </div>

      {message && <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{message}</p>}
    </div>
  );
}

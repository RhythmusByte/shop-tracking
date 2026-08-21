"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { todayStr } from "@/lib/date";
import { totalSales } from "@/lib/calc";

const EMPTY = {
  onlineSales: 0,
  offlineSales: 0,
  cashSales: 0,
  upiSales: 0,
  cardSales: 0,
  creditSales: 0,
  totalExpense: 0,
  adStartTime: "",
  adStartedOnTime: false,
  adConversions: 0,
  openingTime: "",
  stockInTime: "",
  stockInNotes: "",
  stockLeftChecked: false,
  stockLeftNotes: "",
  bankStatementChecked: false,
  bankCreditedBy12PM: false,
  fmoAccountAmount: "",
  damagesChecked: false,
  damagesFound: false,
  damagesNotes: "",
  storeCalled: false,
  moneyDeposited: false,
  notes: "",
};

export default function StoreEntryPage({ params }) {
  const storeId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [date, setDate] = useState(searchParams.get("date") || todayStr());
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const [purchases, setPurchases] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({ description: "", amount: "", vendor: "", notes: "" });
  const [purchaseSaving, setPurchaseSaving] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", notes: "" });
  const [expenseSaving, setExpenseSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [storesRes, entryRes, purchasesRes, expensesRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch(`/api/entries?store=${storeId}&date=${date}`).then((r) => r.json()),
      fetch(`/api/purchases?store=${storeId}&date=${date}`).then((r) => r.json()),
      fetch(`/api/expenses?store=${storeId}&date=${date}`).then((r) => r.json()),
    ]);
    const s = (storesRes.stores || []).find((x) => x._id === storeId);
    setStore(s || null);
    const existing = (entryRes.entries || [])[0];
    setForm(existing ? { ...EMPTY, ...existing } : EMPTY);
    setPurchases(purchasesRes.purchases || []);
    setExpenses(expensesRes.expenses || []);
    setLoading(false);
  }, [storeId, date]);

  useEffect(() => {
    load();
  }, [load]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeId, date, ...form, totalExpense: expenseTotal || Number(form.totalExpense || 0) }),
    });
    setSaving(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString());
  }

  async function addPurchase(e) {
    e.preventDefault();
    if (!purchaseForm.description || !purchaseForm.amount) return;
    setPurchaseSaving(true);
    const res = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: storeId,
        date,
        description: purchaseForm.description,
        amount: Number(purchaseForm.amount),
        vendor: purchaseForm.vendor,
        notes: purchaseForm.notes,
      }),
    });
    setPurchaseSaving(false);
    if (res.ok) {
      setPurchaseForm({ description: "", amount: "", vendor: "", notes: "" });
      const p = await fetch(`/api/purchases?store=${storeId}&date=${date}`).then((r) => r.json());
      setPurchases(p.purchases || []);
    }
  }

  async function deletePurchase(id) {
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    setPurchases((prev) => prev.filter((p) => p._id !== id));
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    setExpenseSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store: storeId,
        date,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        notes: expenseForm.notes,
      }),
    });
    setExpenseSaving(false);
    if (res.ok) {
      setExpenseForm({ description: "", amount: "", notes: "" });
      const d = await fetch(`/api/expenses?store=${storeId}&date=${date}`).then((r) => r.json());
      setExpenses(d.expenses || []);
    }
  }

  async function deleteExpense(id) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((item) => item._id !== id));
  }

  if (loading) return <p className="text-sm text-purple-100/70">Loading...</p>;
  if (!store) return <p className="text-sm text-red-300">Store not found.</p>;

  const purchaseTotal = useMemo(() => purchases.reduce((sum, p) => sum + p.amount, 0), [purchases]);
  const expenseTotal = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses]);
  const sales = totalSales(form);
  const managerPhone = (store.managerContact || "").replace(/\D/g, "");
  const whatsappUrl = managerPhone ? `https://wa.me/${managerPhone.length === 10 ? `91${managerPhone}` : managerPhone}` : "";

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={() => router.push("/")} className="text-sm text-slate-300 hover:text-white self-start">
          ← Dashboard
        </button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-full sm:w-auto" />
      </div>

      <div className="card card-glow animate-fade-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-200/70 mb-2">Store details</p>
            <h1 className="text-2xl font-semibold text-white">
              {store.name} <span className="text-purple-200/70 font-normal text-base">({store.code})</span>
            </h1>
            <div className="mt-3 grid gap-2 text-sm text-purple-100/80">
              {store.storeNumber && <p>Store number: {store.storeNumber}</p>}
              {store.managerName && <p>Manager: {store.managerName}</p>}
              {store.managerContact && <p>Mobile: {store.managerContact}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                WhatsApp manager
              </a>
            )}
            {store.managerContact && (
              <a href={`tel:${store.managerContact}`} className="btn-secondary">
                Call manager
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Sales today" value={`₹${sales.toLocaleString()}`} accent />
        <Stat label="Purchases" value={`₹${purchaseTotal.toLocaleString()}`} />
        <Stat label="Expenses" value={`₹${expenseTotal.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Sales by payment method">
          <Field label="Online sales count">
            <input type="number" className="input" value={form.onlineSales}
              onChange={(e) => set("onlineSales", Number(e.target.value))} />
          </Field>
          <Field label="Offline sales count">
            <input type="number" className="input" value={form.offlineSales}
              onChange={(e) => set("offlineSales", Number(e.target.value))} />
          </Field>
          <Field label="Cash amount (₹)">
            <input type="number" className="input" value={form.cashSales}
              onChange={(e) => set("cashSales", Number(e.target.value))} />
          </Field>
          <Field label="UPI amount (₹)">
            <input type="number" className="input" value={form.upiSales}
              onChange={(e) => set("upiSales", Number(e.target.value))} />
          </Field>
          <Field label="Card amount (₹)">
            <input type="number" className="input" value={form.cardSales}
              onChange={(e) => set("cardSales", Number(e.target.value))} />
          </Field>
          <Field label="Credit amount (₹)">
            <input type="number" className="input" value={form.creditSales}
              onChange={(e) => set("creditSales", Number(e.target.value))} />
          </Field>
          <div className="pt-2 border-t border-slate-100 text-sm font-medium text-slate-700">
            Total sale amount: ₹{sales.toLocaleString()}
          </div>
        </Section>

        <Section title="Expense">
          <Field label="Manual total expense (₹)">
            <input type="number" className="input" value={form.totalExpense}
              onChange={(e) => set("totalExpense", Number(e.target.value))} />
          </Field>
          <p className="text-xs text-slate-500">
            Daily expense items below are summed into the total when you save the entry.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="input sm:col-span-1"
                placeholder="Expense description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input
                className="input"
                type="number"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))}
                />
                <button type="submit" disabled={expenseSaving} className="btn-secondary shrink-0">
                  Add
                </button>
              </div>
            </form>
            <div className="mt-3 space-y-2">
              {expenses.length === 0 ? (
                <p className="text-sm text-slate-500">No expenses logged for this date.</p>
              ) : (
                expenses.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{item.description}</p>
                      {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-slate-800">₹{Number(item.amount || 0).toLocaleString()}</span>
                      <button onClick={() => deleteExpense(item._id)} className="text-xs text-red-500 hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex justify-between text-sm font-semibold text-slate-800">
              <span>Expense total</span>
              <span>₹{expenseTotal.toLocaleString()}</span>
            </div>
          </div>
        </Section>

        <Section title="Ad Performance (must start 6 AM)">
          <Field label="Ad start time">
            <input type="time" className="input" value={form.adStartTime}
              onChange={(e) => set("adStartTime", e.target.value)} />
          </Field>
          <Checkbox label="Started on time (6:00 AM)" checked={form.adStartedOnTime}
            onChange={(v) => set("adStartedOnTime", v)} />
          <Field label="Orders converted via ad (count)">
            <input type="number" className="input" value={form.adConversions}
              onChange={(e) => set("adConversions", Number(e.target.value))} />
          </Field>
        </Section>

        <Section title="Opening Time">
          <Field label="Store opened at">
            <input type="time" className="input" value={form.openingTime}
              onChange={(e) => set("openingTime", e.target.value)} />
          </Field>
          {store.expectedOpeningTime && (
            <p className="text-xs text-slate-400">Expected: {store.expectedOpeningTime}</p>
          )}
        </Section>

        <Section title="Stock Received">
          <Field label="Stock entered at">
            <input type="time" className="input" value={form.stockInTime}
              onChange={(e) => set("stockInTime", e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.stockInNotes}
              onChange={(e) => set("stockInNotes", e.target.value)} />
          </Field>
        </Section>

        <Section title="Stock Left (check next morning)">
          <Checkbox label="Checked this morning" checked={form.stockLeftChecked}
            onChange={(v) => set("stockLeftChecked", v)} />
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.stockLeftNotes}
              onChange={(e) => set("stockLeftNotes", e.target.value)} />
          </Field>
        </Section>

        <Section title="Bank Statement (previous day)">
          <Checkbox label="Checked bank statement" checked={form.bankStatementChecked}
            onChange={(v) => set("bankStatementChecked", v)} />
          <Checkbox label="Credited by 12 PM" checked={form.bankCreditedBy12PM}
            onChange={(v) => set("bankCreditedBy12PM", v)} />
          <Field label="FMO account amount">
            <input
              type="text"
              className="input"
              value={form.fmoAccountAmount}
              onChange={(e) => set("fmoAccountAmount", e.target.value)}
              placeholder="Personal reference only"
            />
          </Field>
        </Section>

        <Section title="Damages">
          <Checkbox label="Damages checked" checked={form.damagesChecked}
            onChange={(v) => set("damagesChecked", v)} />
          <Checkbox label="Damages found" checked={form.damagesFound}
            onChange={(v) => set("damagesFound", v)} />
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.damagesNotes}
              onChange={(e) => set("damagesNotes", e.target.value)} />
          </Field>
        </Section>

        <Section title="Store Call Confirmation">
          <Checkbox label="Called the store" checked={form.storeCalled}
            onChange={(v) => set("storeCalled", v)} />
          <Checkbox label="Money deposited" checked={form.moneyDeposited}
            onChange={(v) => set("moneyDeposited", v)} />
        </Section>

        <Section title="Notes">
          <textarea className="input" rows={3} value={form.notes}
            onChange={(e) => set("notes", e.target.value)} />
        </Section>
      </div>

      <div className="flex items-center gap-3 mt-6 mb-8">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save entry"}
        </button>
        {savedAt && <span className="text-xs text-slate-300">Saved at {savedAt}</span>}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Purchases for {date}</h3>
        <form onSubmit={addPurchase} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <input className="input sm:col-span-2" placeholder="Description"
            value={purchaseForm.description}
            onChange={(e) => setPurchaseForm((f) => ({ ...f, description: e.target.value }))} />
          <input className="input" type="number" placeholder="Amount"
            value={purchaseForm.amount}
            onChange={(e) => setPurchaseForm((f) => ({ ...f, amount: e.target.value }))} />
          <div className="flex gap-2">
            <input className="input" placeholder="Vendor (optional)"
              value={purchaseForm.vendor}
              onChange={(e) => setPurchaseForm((f) => ({ ...f, vendor: e.target.value }))} />
            <button type="submit" disabled={purchaseSaving} className="btn-secondary shrink-0">Add</button>
          </div>
          <input
            className="input sm:col-span-2 lg:col-span-4"
            placeholder="Purchase notes (optional)"
            value={purchaseForm.notes}
            onChange={(e) => setPurchaseForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </form>

        {purchases.length === 0 ? (
          <p className="text-sm text-slate-500">No purchases logged for this date.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <span className="text-slate-700">{p.description}</span>
                  {p.vendor && <span className="text-slate-400"> · {p.vendor}</span>}
                  {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-800">₹{p.amount.toLocaleString()}</span>
                  <button onClick={() => deletePurchase(p._id)} className="text-red-500 hover:underline text-xs">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 text-sm font-semibold text-slate-800">
              <span>Total</span>
              <span>₹{purchaseTotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`card ${accent ? "card-glow" : ""} animate-fade-in`}>
      <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="checkbox-row cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

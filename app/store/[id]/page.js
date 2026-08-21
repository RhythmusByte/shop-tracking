"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { todayStr } from "@/lib/date";
import { totalSales } from "@/lib/calc";

const EMPTY = {
  onlineSales: 0,
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
  const [purchaseForm, setPurchaseForm] = useState({ description: "", amount: "", vendor: "" });
  const [purchaseSaving, setPurchaseSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [storesRes, entryRes, purchasesRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch(`/api/entries?store=${storeId}&date=${date}`).then((r) => r.json()),
      fetch(`/api/purchases?store=${storeId}&date=${date}`).then((r) => r.json()),
    ]);
    const s = (storesRes.stores || []).find((x) => x._id === storeId);
    setStore(s || null);
    const existing = (entryRes.entries || [])[0];
    setForm(existing ? { ...EMPTY, ...existing } : EMPTY);
    setPurchases(purchasesRes.purchases || []);
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
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeId, date, ...form }),
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
      }),
    });
    setPurchaseSaving(false);
    if (res.ok) {
      setPurchaseForm({ description: "", amount: "", vendor: "" });
      const p = await fetch(`/api/purchases?store=${storeId}&date=${date}`).then((r) => r.json());
      setPurchases(p.purchases || []);
    }
  }

  async function deletePurchase(id) {
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
    setPurchases((prev) => prev.filter((p) => p._id !== id));
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!store) return <p className="text-sm text-red-600">Store not found.</p>;

  const purchaseTotal = purchases.reduce((sum, p) => sum + p.amount, 0);
  const sales = totalSales(form);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-800">
          ← Dashboard
        </button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-1">
        {store.name} <span className="text-slate-400 font-normal text-base">({store.code})</span>
      </h1>
      <p className="text-sm text-slate-500 mb-5">
        Total sales today: <span className="font-semibold text-slate-800">₹{sales.toLocaleString()}</span>
        {"  ·  "}
        Purchases: <span className="font-semibold text-slate-800">₹{purchaseTotal.toLocaleString()}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Sales by payment method">
          <Field label="Online sales (₹)">
            <input type="number" className="input" value={form.onlineSales}
              onChange={(e) => set("onlineSales", Number(e.target.value))} />
          </Field>
          <Field label="Cash (₹)">
            <input type="number" className="input" value={form.cashSales}
              onChange={(e) => set("cashSales", Number(e.target.value))} />
          </Field>
          <Field label="UPI (₹)">
            <input type="number" className="input" value={form.upiSales}
              onChange={(e) => set("upiSales", Number(e.target.value))} />
          </Field>
          <Field label="Card (₹)">
            <input type="number" className="input" value={form.cardSales}
              onChange={(e) => set("cardSales", Number(e.target.value))} />
          </Field>
          <Field label="Credit (₹)">
            <input type="number" className="input" value={form.creditSales}
              onChange={(e) => set("creditSales", Number(e.target.value))} />
          </Field>
          <div className="pt-2 border-t border-slate-100 text-sm font-medium text-slate-700">
            Total sale: ₹{sales.toLocaleString()}
          </div>
        </Section>

        <Section title="Expense">
          <Field label="Total expense today (₹)">
            <input type="number" className="input" value={form.totalExpense}
              onChange={(e) => set("totalExpense", Number(e.target.value))} />
          </Field>
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
        {savedAt && <span className="text-xs text-slate-400">Saved at {savedAt}</span>}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Purchases for {date}</h3>
        <form onSubmit={addPurchase} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
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
        </form>

        {purchases.length === 0 ? (
          <p className="text-sm text-slate-500">No purchases logged for this date.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <div key={p._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="text-slate-700">{p.description}</span>
                  {p.vendor && <span className="text-slate-400"> · {p.vendor}</span>}
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

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="checkbox-row cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

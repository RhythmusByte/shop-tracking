"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

const EMPTY = {
  onlineSales: 0,
  offlineSales: 0,
  adStartTime: "",
  adStartedOnTime: false,
  adSalesConverted: 0,
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

  const load = useCallback(async () => {
    setLoading(true);
    const [storesRes, entryRes] = await Promise.all([
      fetch("/api/stores").then((r) => r.json()),
      fetch(`/api/entries?store=${storeId}&date=${date}`).then((r) => r.json()),
    ]);
    const s = (storesRes.stores || []).find((x) => x._id === storeId);
    setStore(s || null);
    const existing = (entryRes.entries || [])[0];
    setForm(existing ? { ...EMPTY, ...existing } : EMPTY);
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
    if (res.ok) {
      setSavedAt(new Date().toLocaleTimeString());
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!store) return <p className="text-sm text-red-600">Store not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-800">
          ← Dashboard
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto"
        />
      </div>
      <h1 className="text-xl font-semibold text-slate-800 mb-5">
        {store.name} <span className="text-slate-400 font-normal text-base">({store.code})</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales */}
        <Section title="Online & Offline Sales">
          <Field label="Online sales (₹)">
            <input type="number" className="input" value={form.onlineSales}
              onChange={(e) => set("onlineSales", Number(e.target.value))} />
          </Field>
          <Field label="Offline sales (₹)">
            <input type="number" className="input" value={form.offlineSales}
              onChange={(e) => set("offlineSales", Number(e.target.value))} />
          </Field>
        </Section>

        {/* Ads */}
        <Section title="Ad Performance (must start 6 AM)">
          <Field label="Ad start time">
            <input type="time" className="input" value={form.adStartTime}
              onChange={(e) => set("adStartTime", e.target.value)} />
          </Field>
          <Checkbox label="Started on time (6:00 AM)" checked={form.adStartedOnTime}
            onChange={(v) => set("adStartedOnTime", v)} />
          <Field label="Sales converted via ad (₹)">
            <input type="number" className="input" value={form.adSalesConverted}
              onChange={(e) => set("adSalesConverted", Number(e.target.value))} />
          </Field>
        </Section>

        {/* Opening */}
        <Section title="Opening Time">
          <Field label="Store opened at">
            <input type="time" className="input" value={form.openingTime}
              onChange={(e) => set("openingTime", e.target.value)} />
          </Field>
        </Section>

        {/* Stock in */}
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

        {/* Stock left - checked next morning */}
        <Section title="Stock Left (check next morning)">
          <Checkbox label="Checked this morning" checked={form.stockLeftChecked}
            onChange={(v) => set("stockLeftChecked", v)} />
          <Field label="Notes">
            <textarea className="input" rows={2} value={form.stockLeftNotes}
              onChange={(e) => set("stockLeftNotes", e.target.value)} />
          </Field>
        </Section>

        {/* Bank */}
        <Section title="Bank Statement (previous day)">
          <Checkbox label="Checked bank statement" checked={form.bankStatementChecked}
            onChange={(v) => set("bankStatementChecked", v)} />
          <Checkbox label="Credited by 12 PM" checked={form.bankCreditedBy12PM}
            onChange={(v) => set("bankCreditedBy12PM", v)} />
        </Section>

        {/* Damages */}
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

        {/* Store call */}
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

      <div className="flex items-center gap-3 mt-6">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save entry"}
        </button>
        {savedAt && <span className="text-xs text-slate-400">Saved at {savedAt}</span>}
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
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

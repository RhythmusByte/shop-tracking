"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Phone } from "lucide-react";
import { todayStr, formatDMY } from "@/lib/date";
import { telecallingStats } from "@/lib/calc";
import PageLoader from "@/components/PageLoader";

const EMPTY = {
  ratesReady: null,
  sharedWithTeam: false,
  scheduledFor6AM: false,
  noAdStatus: "",
  telecallingDataAvailable: null,
  contactsReceived: 0,
  contactsAccepted: 0,
  contactsLeftToCall: 0,
  contactsConverted: 0,
  notes: "",
};

export default function AdCampaignPage() {
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const storesRes = await fetch("/api/stores").then((r) => r.json());
    const active = (storesRes.stores || []).filter((s) => s.active);
    setStores(active);
    const id = storeId || active[0]?._id || "";
    if (id && id !== storeId) setStoreId(id);

    if (id) {
      const campaignRes = await fetch(`/api/ad-campaigns?store=${id}&date=${date}`).then((r) => r.json());
      const existing = (campaignRes.campaigns || [])[0];
      setForm(existing ? { ...EMPTY, ...existing } : EMPTY);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, storeId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, storeId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    if (!storeId) return;
    setSaving(true);
    const res = await fetch("/api/ad-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeId, date, ...form }),
    });
    setSaving(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString());
  }

  const stats = form.telecallingDataAvailable ? telecallingStats(form) : null;
  const currentStore = stores.find((s) => s._id === storeId);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Megaphone size={20} className="text-brand-600 dark:text-brand-300" />
        <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50">Ad Campaign</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        {currentStore ? currentStore.name : ""} · {formatDMY(date)}
      </p>

      <div className="card mb-5 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Store</label>
            <select className="input" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading campaign details" />
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Ad rates checklist */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">
              Got the rates for tomorrow's ad campaign?
            </h3>
            <YesNoToggle value={form.ratesReady} onChange={(v) => set("ratesReady", v)} />

            {form.ratesReady === true && (
              <div className="mt-4 space-y-2 animate-fade-in">
                <Checkbox label="Shared it with the team" checked={form.sharedWithTeam}
                  onChange={(v) => set("sharedWithTeam", v)} />
                <Checkbox label="Scheduled the ad for 6 AM" checked={form.scheduledFor6AM}
                  onChange={(v) => set("scheduledFor6AM", v)} />
              </div>
            )}

            {form.ratesReady === false && (
              <div className="mt-4 animate-fade-in">
                <label className="label">Status</label>
                <select className="input" value={form.noAdStatus} onChange={(e) => set("noAdStatus", e.target.value)}>
                  <option value="">Select one</option>
                  <option value="yet-to-do">Yet to do</option>
                  <option value="no-ad">No ad for tomorrow</option>
                </select>
              </div>
            )}
          </div>

          {/* Telecalling campaign */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={16} className="text-brand-600 dark:text-brand-300" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100">
                Got the numbers for the telecalling campaign?
              </h3>
            </div>
            <YesNoToggle value={form.telecallingDataAvailable} onChange={(v) => set("telecallingDataAvailable", v)} />

            {form.telecallingDataAvailable === true && (
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contacts received">
                    <input type="number" className="input" value={form.contactsReceived}
                      onChange={(e) => set("contactsReceived", Number(e.target.value))} />
                  </Field>
                  <Field label="Contacts accepted the call">
                    <input type="number" className="input" value={form.contactsAccepted}
                      onChange={(e) => set("contactsAccepted", Number(e.target.value))} />
                  </Field>
                  <Field label="Contacts left to call">
                    <input type="number" className="input" value={form.contactsLeftToCall}
                      onChange={(e) => set("contactsLeftToCall", Number(e.target.value))} />
                  </Field>
                  <Field label="Contacts converted">
                    <input type="number" className="input" value={form.contactsConverted}
                      onChange={(e) => set("contactsConverted", Number(e.target.value))} />
                  </Field>
                </div>

                {stats && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3">
                      <p className="text-xs opacity-90">Received vs left to call</p>
                      <p className="text-lg font-bold">{stats.received} / {stats.leftToCall}</p>
                      <p className="text-xs opacity-90 mt-0.5">{stats.receivedVsLeftPct}% worked through</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-3">
                      <p className="text-xs opacity-90">Accepted vs converted</p>
                      <p className="text-lg font-bold">{stats.accepted} / {stats.converted}</p>
                      <p className="text-xs opacity-90 mt-0.5">{stats.acceptedVsConvertedPct}% conversion</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.telecallingDataAvailable === false && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Skipped for today.</p>
            )}
          </div>

          <div className="card">
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving || !storeId} className="btn-primary">
              {saving ? "Saving..." : "Save campaign"}
            </button>
            {savedAt && <span className="text-xs text-slate-400 dark:text-slate-500">Saved at {savedAt}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function YesNoToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#3a2a52] p-1">
      <button
        onClick={() => onChange(true)}
        className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all duration-150 ${
          value === true ? "bg-green-600 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={`text-xs px-4 py-1.5 rounded-md font-medium transition-all duration-150 ${
          value === false ? "bg-red-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        No
      </button>
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
      <span className="text-sm text-slate-700 dark:text-brand-100">{label}</span>
    </label>
  );
}

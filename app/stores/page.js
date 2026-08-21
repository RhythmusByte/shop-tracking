"use client";

import { useEffect, useState } from "react";

const BLANK = { name: "", code: "", storeNumber: "", managerName: "", managerContact: "", expectedOpeningTime: "", expectedStockCheckTime: "" };

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [newStore, setNewStore] = useState(BLANK);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/stores").then((r) => r.json());
    setStores(res.stores || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addStore(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStore),
    });
    if (res.ok) {
      setNewStore(BLANK);
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to add store");
    }
  }

  function startEdit(store) {
    setEditingId(store._id);
    setEditForm({
      name: store.name,
      code: store.code,
      storeNumber: store.storeNumber || "",
      managerName: store.managerName || "",
      managerContact: store.managerContact || "",
      expectedOpeningTime: store.expectedOpeningTime || "",
      expectedStockCheckTime: store.expectedStockCheckTime || "",
    });
  }

  async function saveEdit(id) {
    setSaving(true);
    const res = await fetch(`/api/stores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      load();
    }
  }

  async function toggleActive(store) {
    await fetch(`/api/stores/${store._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !store.active }),
    });
    load();
  }

  function whatsappUrl(contact) {
    const digits = (contact || "").replace(/\D/g, "");
    if (!digits) return "";
    return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold text-white mb-5">Stores</h1>

      <form onSubmit={addStore} className="card mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add a store</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Name">
            <input className="input" value={newStore.name} placeholder="e.g. Technopark Store 1"
              onChange={(e) => setNewStore((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Code">
            <input className="input" value={newStore.code} placeholder="e.g. TVM1"
              onChange={(e) => setNewStore((f) => ({ ...f, code: e.target.value }))} />
          </Field>
          <Field label="Store number">
            <input className="input" value={newStore.storeNumber}
              onChange={(e) => setNewStore((f) => ({ ...f, storeNumber: e.target.value }))} />
          </Field>
          <Field label="Manager name">
            <input className="input" value={newStore.managerName}
              onChange={(e) => setNewStore((f) => ({ ...f, managerName: e.target.value }))} />
          </Field>
          <Field label="Manager contact">
            <input className="input" value={newStore.managerContact}
              onChange={(e) => setNewStore((f) => ({ ...f, managerContact: e.target.value }))} />
          </Field>
          <Field label="Expected opening time">
            <input type="time" className="input" value={newStore.expectedOpeningTime}
              onChange={(e) => setNewStore((f) => ({ ...f, expectedOpeningTime: e.target.value }))} />
          </Field>
          <Field label="Expected stock check time">
            <input type="time" className="input" value={newStore.expectedStockCheckTime}
              onChange={(e) => setNewStore((f) => ({ ...f, expectedStockCheckTime: e.target.value }))} />
          </Field>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button type="submit" className="btn-primary">Add store</button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <div key={s._id} className="card animate-fade-in">
              {editingId === s._id ? (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label="Name">
                      <input className="input" value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                    </Field>
                    <Field label="Code">
                      <input className="input" value={editForm.code}
                        onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} />
                    </Field>
                    <Field label="Store number">
                      <input className="input" value={editForm.storeNumber}
                        onChange={(e) => setEditForm((f) => ({ ...f, storeNumber: e.target.value }))} />
                    </Field>
                    <Field label="Manager name">
                      <input className="input" value={editForm.managerName}
                        onChange={(e) => setEditForm((f) => ({ ...f, managerName: e.target.value }))} />
                    </Field>
                    <Field label="Manager contact">
                      <input className="input" value={editForm.managerContact}
                        onChange={(e) => setEditForm((f) => ({ ...f, managerContact: e.target.value }))} />
                    </Field>
                    <Field label="Expected opening time">
                      <input type="time" className="input" value={editForm.expectedOpeningTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, expectedOpeningTime: e.target.value }))} />
                    </Field>
                    <Field label="Expected stock check time">
                      <input type="time" className="input" value={editForm.expectedStockCheckTime}
                        onChange={(e) => setEditForm((f) => ({ ...f, expectedStockCheckTime: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s._id)} disabled={saving} className="btn-primary">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {s.name} <span className="text-slate-400 font-normal">({s.code})</span>
                    </p>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                      {s.storeNumber && <p>Store #{s.storeNumber}</p>}
                      {s.managerName && <p>Manager: {s.managerName} {s.managerContact && `· ${s.managerContact}`}</p>}
                      {s.expectedOpeningTime && <p>Expected open: {s.expectedOpeningTime}</p>}
                    </div>
                    {whatsappUrl(s.managerContact) && (
                      <a
                        href={whatsappUrl(s.managerContact)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-3 text-xs text-brand-600 hover:underline"
                      >
                        Open WhatsApp
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(s)} className="text-xs text-brand-600 hover:underline">
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(s)}
                      className={`text-xs px-3 py-1 rounded-full ${
                        s.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {stores.length === 0 && <p className="text-sm text-slate-500">No stores yet.</p>}
        </div>
      )}
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

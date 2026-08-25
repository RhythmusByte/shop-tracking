"use client";

import { useEffect, useState } from "react";
import { whatsappLink } from "@/lib/calc";
import PageLoader from "@/components/PageLoader";

const BLANK = { name: "", code: "", storeNumber: "", managerName: "", managerContact: "", expectedOpeningTime: "", expectedStockCheckTime: "" };
const BLANK_STAFF = { name: "", monthlySalary: "" };

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [newStore, setNewStore] = useState(BLANK);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const [staffByStore, setStaffByStore] = useState({});
  const [staffOpenFor, setStaffOpenFor] = useState(null);
  const [staffForm, setStaffForm] = useState(BLANK_STAFF);

  async function load() {
    const res = await fetch("/api/stores").then((r) => r.json());
    setStores(res.stores || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadStaff(storeId) {
    const res = await fetch(`/api/staff?store=${storeId}`).then((r) => r.json());
    setStaffByStore((prev) => ({ ...prev, [storeId]: res.staff || [] }));
  }

  function toggleStaffPanel(storeId) {
    const opening = staffOpenFor !== storeId;
    setStaffOpenFor(opening ? storeId : null);
    if (opening && !staffByStore[storeId]) loadStaff(storeId);
  }

  async function addStaff(storeId, e) {
    e.preventDefault();
    if (!staffForm.name || staffForm.monthlySalary === "") return;
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: storeId, name: staffForm.name, monthlySalary: Number(staffForm.monthlySalary) }),
    });
    if (res.ok) {
      setStaffForm(BLANK_STAFF);
      loadStaff(storeId);
    }
  }

  async function toggleStaffActive(storeId, staff) {
    await fetch(`/api/staff/${staff._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !staff.active }),
    });
    loadStaff(storeId);
  }

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-5">Stores</h1>

      <form onSubmit={addStore} className="card mb-6 animate-fade-in">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">Add a store</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
            <input className="input" value={newStore.managerContact} placeholder="10-digit mobile number"
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
        {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
        <button type="submit" className="btn-primary">Add store</button>
      </form>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <div key={s._id} className="card animate-fade-in">
              {editingId === s._id ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                      <input className="input" value={editForm.managerContact} placeholder="10-digit mobile number"
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
                <>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-brand-50">
                        {s.name} <span className="text-slate-400 dark:text-slate-500 font-normal">({s.code})</span>
                      </p>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        {s.storeNumber && <p>Store #{s.storeNumber}</p>}
                        {s.managerName && <p>Manager: {s.managerName} {s.managerContact && `· ${s.managerContact}`}</p>}
                        {s.expectedOpeningTime && <p>Expected open: {s.expectedOpeningTime}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {whatsappLink(s.managerContact) && (
                        <a
                          href={whatsappLink(s.managerContact)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors duration-150 flex items-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.87 9.87 0 004.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 01-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.55-3.7 8.21-8.24 8.21zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.49-.41-.42-.56-.43-.14-.01-.31-.01-.47-.01-.17 0-.43.06-.66.31s-.87.85-.87 2.08.89 2.41 1.02 2.58c.12.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29z" />
                          </svg>
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => toggleStaffPanel(s._id)} className="text-xs text-brand-600 dark:text-brand-300 hover:underline">
                        Staff
                      </button>
                      <button onClick={() => startEdit(s)} className="text-xs text-brand-600 dark:text-brand-300 hover:underline">
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(s)}
                        className={`text-xs px-3 py-1 rounded-full ${
                          s.active ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500 dark:bg-[#2c2140] dark:text-slate-400"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>

                  {staffOpenFor === s._id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#3a2a52] animate-fade-in">
                      <h4 className="text-xs font-semibold text-slate-600 dark:text-brand-200 mb-2">Staff</h4>
                      <form onSubmit={(e) => addStaff(s._id, e)} className="flex flex-col sm:flex-row gap-2 mb-3">
                        <input className="input" placeholder="Staff name" value={staffForm.name}
                          onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} />
                        <input className="input sm:w-40" type="number" placeholder="Monthly salary"
                          value={staffForm.monthlySalary}
                          onChange={(e) => setStaffForm((f) => ({ ...f, monthlySalary: e.target.value }))} />
                        <button type="submit" className="btn-secondary shrink-0">Add</button>
                      </form>
                      {(staffByStore[s._id] || []).length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No staff added yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-[#3a2a52]">
                          {(staffByStore[s._id] || []).map((st) => (
                            <div key={st._id} className="flex items-center justify-between py-1.5 text-sm">
                              <span className={st.active ? "text-slate-700 dark:text-brand-100" : "text-slate-400 dark:text-slate-500 line-through"}>
                                {st.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 dark:text-slate-400">₹{st.monthlySalary.toLocaleString()}/mo</span>
                                <button onClick={() => toggleStaffActive(s._id, st)} className="text-xs text-red-500 hover:underline">
                                  {st.active ? "Deactivate" : "Reactivate"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {stores.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No stores yet.</p>}
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

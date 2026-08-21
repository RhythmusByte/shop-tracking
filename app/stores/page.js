"use client";

import { useEffect, useState } from "react";

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      body: JSON.stringify({ name, code }),
    });
    if (res.ok) {
      setName("");
      setCode("");
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to add store");
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
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-5">Stores</h1>

      <form onSubmit={addStore} className="card mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Add a store</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Technopark Store 1" />
          </div>
          <div>
            <label className="label">Code</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TVM1" />
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <button type="submit" className="btn-primary">Add store</button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">All stores</h3>
          <div className="divide-y divide-slate-100">
            {stores.map((s) => (
              <div key={s._id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.code}</p>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className={`text-xs px-3 py-1 rounded-full ${
                    s.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.active ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
            {stores.length === 0 && <p className="text-sm text-slate-500">No stores yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "staff" });
  const [error, setError] = useState("");
  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  async function load() {
    const res = await fetch("/api/users");
    if (res.status === 403) {
      setError("Admins only.");
      setLoading(false);
      return;
    }
    const d = await res.json();
    setUsers(d.users || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ username: "", password: "", name: "", role: "staff" });
      load();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to create user");
    }
  }

  async function changeRole(id, role) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function submitReset(id) {
    if (resetPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    setResetId(null);
    setResetPassword("");
    setError("");
  }

  async function deleteUser(id) {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json();
      setError(d.error || "Failed to delete user");
    }
  }

  if (error === "Admins only.") {
    return <p className="text-sm text-red-600 dark:text-red-400">Admins only.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-5">Users</h1>

      <form onSubmit={createUser} className="card mb-6 animate-fade-in">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">Create a user</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="input" placeholder="Username" value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <input className="input" placeholder="Display name (optional)" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input" type="password" placeholder="Password (min 8 chars)" value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && error !== "Admins only." && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
        <button type="submit" className="btn-primary">Create user</button>
      </form>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="card animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-brand-50">
                    {u.username} {u.name && <span className="text-slate-400 font-normal">({u.name})</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    className="text-xs input w-auto py-1"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => setResetId(resetId === u._id ? null : u._id)} className="text-xs text-brand-600 dark:text-brand-300 hover:underline">
                    Reset password
                  </button>
                  <button onClick={() => deleteUser(u._id)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
              {resetId === u._id && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="password"
                    className="input"
                    placeholder="New password (min 8 chars)"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                  <button onClick={() => submitReset(u._id)} className="btn-secondary shrink-0">Save</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

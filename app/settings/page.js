"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import PageLoader from "@/components/PageLoader";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSavedAt, setPwSavedAt] = useState(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.profile?.name || "");
        setAvatarUrl(d.profile?.avatarUrl || "");
        setRole(d.profile?.role || "");
        setLoading(false);
      });
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatarUrl }),
    });
    setSaving(false);
    if (res.ok) setSavedAt(new Date().toLocaleTimeString());
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwSaving(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setPwSavedAt(new Date().toLocaleTimeString());
    } else {
      const d = await res.json();
      setPwError(d.error || "Failed to change password");
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50">Profile settings</h1>

      <form onSubmit={save} className="card space-y-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrl} name={name} size={56} />
          <div className="flex-1">
            <label className="label">Display name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        </div>

        <div>
          <label className="label">Profile picture URL</label>
          <input
            className="input"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://... (leave blank for a default icon)"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Paste a direct image link. If it fails to load or is left blank, a default icon with your initial is shown.
          </p>
        </div>

        {role && <p className="text-xs text-slate-400 dark:text-slate-500">Role: {role}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
          {savedAt && <span className="text-xs text-slate-400 dark:text-slate-500">Saved at {savedAt}</span>}
        </div>
      </form>

      <form onSubmit={changePassword} className="card space-y-4 animate-fade-in">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-brand-100">Change password</h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">New password (min 8 characters)</label>
          <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {pwError && <p className="text-sm text-red-600 dark:text-red-400">{pwError}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pwSaving} className="btn-secondary">
            {pwSaving ? "Saving..." : "Change password"}
          </button>
          {pwSavedAt && <span className="text-xs text-slate-400 dark:text-slate-500">Changed at {pwSavedAt}</span>}
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setName(d.profile?.name || "");
        setAvatarUrl(d.profile?.avatarUrl || "");
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

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>;

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-5">Profile settings</h1>

      <form onSubmit={save} className="card space-y-4">
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

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
          {savedAt && <span className="text-xs text-slate-400 dark:text-slate-500">Saved at {savedAt}</span>}
        </div>
      </form>
    </div>
  );
}

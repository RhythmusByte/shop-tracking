"use client";

import { useEffect, useState } from "react";

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default function TodoPage() {
  const date = todayStr();
  const [todo, setTodo] = useState({ calledStores: false, checkedSales: false, confirmedDeposit: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/todo?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        setTodo(d.todo);
        setLoading(false);
      });
  }, [date]);

  async function toggle(field) {
    const next = { ...todo, [field]: !todo[field] };
    setTodo(next);
    await fetch("/api/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, [field]: next[field] }),
    });
  }

  const items = [
    { key: "calledStores", label: "Did I call the stores today?" },
    { key: "checkedSales", label: "Checked the sales" },
    { key: "confirmedDeposit", label: "Confirmed money deposited" },
  ];

  const doneCount = items.filter((i) => todo[i.key]).length;

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Today's TODO</h1>
      <p className="text-sm text-slate-500 mb-5">{date}</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="card">
          <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full ${doneCount === items.length ? "bg-green-500" : "bg-brand-500"}`}
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!todo[item.key]}
                  onChange={() => toggle(item.key)}
                  className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className={`text-sm ${todo[item.key] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3">
        This is a global daily checklist. Per-store call/deposit confirmations are logged on each
        store's entry page and reflected here manually.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { todayStr } from "@/lib/date";

export default function TodoPage() {
  const date = todayStr();
  const [todo, setTodo] = useState({ calledStores: false, checkedSales: false, confirmedDeposit: false });
  const [tasks, setTasks] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newStoreId, setNewStoreId] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const load = useCallback(async () => {
    const [todoRes, tasksRes, storesRes] = await Promise.all([
      fetch(`/api/todo?date=${date}`).then((r) => r.json()),
      fetch(`/api/tasks?date=${date}`).then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]);
    setTodo(todoRes.todo);
    const activeStores = (storesRes.stores || []).filter((s) => s.active);
    setStores(activeStores);

    let currentTasks = tasksRes.tasks || [];

    // Auto-create a "Called <store>" task per active store per day, if missing.
    const missing = activeStores.filter(
      (s) => !currentTasks.some((t) => t.store?._id === s._id && t.title.startsWith("Called "))
    );
    if (missing.length > 0) {
      const created = await Promise.all(
        missing.map((s) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, title: `Called ${s.name}`, store: s._id }),
          }).then((r) => r.json())
        )
      );
      currentTasks = [...currentTasks, ...created.map((c) => c.task)];
    }

    setTasks(currentTasks);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleGlobal(field) {
    const next = { ...todo, [field]: !todo[field] };
    setTodo(next);
    await fetch("/api/todo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, [field]: next[field] }),
    });
  }

  async function toggleTask(task) {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)));
    await fetch(`/api/tasks/${task._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
  }

  async function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  }

  async function addTask(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, title: newTitle, store: newStoreId || undefined, assignedTo: newAssignee }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks((prev) => [...prev, d.task]);
      setNewTitle("");
      setNewStoreId("");
      setNewAssignee("");
    }
  }

  const globalItems = [
    { key: "calledStores", label: "Did I call the stores today?" },
    { key: "checkedSales", label: "Checked the sales" },
    { key: "confirmedDeposit", label: "Confirmed money deposited" },
  ];
  const globalDone = globalItems.filter((i) => todo[i.key]).length;

  const storeCallTasks = tasks.filter((t) => t.store && t.title.startsWith("Called "));
  const otherTasks = tasks.filter((t) => !(t.store && t.title.startsWith("Called ")));

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-1">Today's TODO</h1>
      <p className="text-sm text-slate-500 mb-5">{date}</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Daily checklist</h3>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full ${globalDone === globalItems.length ? "bg-green-500" : "bg-brand-500"}`}
                style={{ width: `${(globalDone / globalItems.length) * 100}%` }}
              />
            </div>
            <div className="space-y-1">
              {globalItems.map((item) => (
                <label key={item.key} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={!!todo[item.key]} onChange={() => toggleGlobal(item.key)}
                    className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <span className={`text-sm ${todo[item.key] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {storeCallTasks.length > 0 && (
            <div className="card mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Per-store calls</h3>
              <div className="space-y-1">
                {storeCallTasks.map((t) => (
                  <label key={t._id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)}
                      className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className={`text-sm ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {t.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Other tasks</h3>
            <form onSubmit={addTask} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
              <input className="input sm:col-span-2" placeholder="Task title" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} />
              <select className="input" value={newStoreId} onChange={(e) => setNewStoreId(e.target.value)}>
                <option value="">No store</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.code}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input className="input" placeholder="Assigned to (optional)" value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)} />
                <button type="submit" className="btn-secondary shrink-0">Add</button>
              </div>
            </form>

            {otherTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No other tasks for today.</p>
            ) : (
              <div className="space-y-1">
                {otherTasks.map((t) => (
                  <div key={t._id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)}
                        className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <span className={`text-sm ${t.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {t.title}
                        {t.store?.code && <span className="text-slate-400"> · {t.store.code}</span>}
                        {t.assignedTo && <span className="text-slate-400"> · {t.assignedTo}</span>}
                      </span>
                    </label>
                    <button onClick={() => deleteTask(t._id)} className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

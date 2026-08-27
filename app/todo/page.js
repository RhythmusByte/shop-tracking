"use client";

import { useEffect, useState, useCallback } from "react";
import { Repeat } from "lucide-react";
import { todayStr, formatDMY } from "@/lib/date";
import PageLoader from "@/components/PageLoader";

export default function TodoPage() {
  const date = todayStr();
  const [tasks, setTasks] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newStoreId, setNewStoreId] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newRecurring, setNewRecurring] = useState(false);

  const load = useCallback(async () => {
    const [tasksRes, storesRes] = await Promise.all([
      fetch(`/api/tasks?date=${date}`).then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ]);
    setStores((storesRes.stores || []).filter((s) => s.active));

    let currentTasks = tasksRes.tasks || [];

    // Recurring tasks: find the latest instance of each distinct recurring
    // title, and if today doesn't already have a copy, create a fresh
    // (undone) one for today.
    const recurringRes = await fetch("/api/tasks?recurring=true").then((r) => r.json());
    const templates = recurringRes.tasks || [];
    const missing = templates.filter(
      (tpl) => !currentTasks.some((t) => t.title === tpl.title && (t.store?._id || null) === (tpl.store?._id || null))
    );
    if (missing.length > 0) {
      const created = await Promise.all(
        missing.map((tpl) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date,
              title: tpl.title,
              store: tpl.store?._id || undefined,
              assignedTo: tpl.assignedTo,
              recurring: true,
            }),
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
      body: JSON.stringify({
        date, title: newTitle, store: newStoreId || undefined, assignedTo: newAssignee, recurring: newRecurring,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      setTasks((prev) => [...prev, d.task]);
      setNewTitle("");
      setNewStoreId("");
      setNewAssignee("");
      setNewRecurring(false);
    }
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-brand-50 mb-1">Today's TODO</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{formatDMY(date)}</p>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="card animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-brand-100 mb-3">Tasks</h3>

          {tasks.length > 0 && (
            <div className="w-full bg-slate-100 dark:bg-[#2c2140] rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${doneCount === tasks.length ? "bg-green-500" : "bg-brand-500"}`}
                style={{ width: `${(doneCount / tasks.length) * 100}%` }}
              />
            </div>
          )}

          <form onSubmit={addTask} className="space-y-2 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input className="input sm:col-span-2" placeholder="Task title" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} />
              <select className="input" value={newStoreId} onChange={(e) => setNewStoreId(e.target.value)}>
                <option value="">No store</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.code}</option>
                ))}
              </select>
              <input className="input" placeholder="Assigned to (optional)" value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <label className="checkbox-row cursor-pointer select-none">
                <input type="checkbox" checked={newRecurring} onChange={(e) => setNewRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-slate-700 dark:text-brand-100 flex items-center gap-1">
                  <Repeat size={13} /> Recurring (repeats every day)
                </span>
              </label>
              <button type="submit" className="btn-secondary">Add task</button>
            </div>
          </form>

          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tasks yet. Add one above.</p>
          ) : (
            <div className="space-y-1">
              {tasks.map((t) => (
                <div key={t._id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#2c2140] transition-colors duration-150">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)}
                      className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className={`text-sm flex items-center gap-1.5 ${t.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-brand-100"}`}>
                      {t.recurring && <Repeat size={12} className="text-brand-500 shrink-0" />}
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
      )}
    </div>
  );
}

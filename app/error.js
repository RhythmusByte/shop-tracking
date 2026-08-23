"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log to the browser console at minimum; swap for a real error-reporting
    // service (Sentry, etc.) if this app ever needs one.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Something went wrong</p>
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-brand-50 mb-2">An error occurred</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        This page hit an unexpected error. You can try again, or head back to the dashboard.
      </p>
      <div className="flex items-center gap-3">
        <button onClick={reset} className="btn-primary">Try again</button>
        <a href="/" className="btn-secondary">Back to Dashboard</a>
      </div>
    </div>
  );
}

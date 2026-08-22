"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:text-brand-200 dark:hover:bg-[#2c2140] transition-colors duration-150"
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 3a1 1 0 011 1v1a1 1 0 11-2 0V4a1 1 0 011-1zm0 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-6a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5 12a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm12.07 6.07a1 1 0 01-1.42 0l-.7-.71a1 1 0 111.41-1.41l.71.7a1 1 0 010 1.42zM7.05 7.05a1 1 0 01-1.41 0l-.71-.7a1 1 0 011.41-1.42l.71.71a1 1 0 010 1.41zm10.02-1.41a1 1 0 010 1.41l-.71.71a1 1 0 11-1.41-1.41l.7-.71a1 1 0 011.42 0zM6.34 17.66a1 1 0 010 1.41l-.71.71a1 1 0 01-1.41-1.41l.7-.71a1 1 0 011.42 0zM12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M21.64 13a9 9 0 11-10.63-10.63 1 1 0 011.11 1.44A7 7 0 1020.2 11.9a1 1 0 011.44 1.1z" />
        </svg>
      )}
    </button>
  );
}

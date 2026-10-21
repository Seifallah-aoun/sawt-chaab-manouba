"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains("dark");
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && (hasDarkClass || prefersDark))) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Avoid hydration mismatch by rendering a neutral placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="تغيير المظهر"
        className={`h-9 w-9 rounded-full border border-zinc-200 bg-white/80 p-2 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 ${className}`}
      >
        <Moon className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "تفعيل الوضع النهاري (Light Mode)" : "تفعيل الوضع الليلي (Dark Mode)"}
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-700 shadow-xs hover:border-red-300 hover:bg-zinc-100 hover:text-red-600 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-amber-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 transition-all cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 animate-fadeIn transition-transform text-amber-400 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 animate-fadeIn transition-transform text-zinc-700 dark:text-zinc-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}

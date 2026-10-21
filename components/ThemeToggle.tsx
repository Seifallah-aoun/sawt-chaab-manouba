"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const syncTheme = () => {
      try {
        const storedTheme = localStorage.getItem("theme");
        const htmlHasDark = document.documentElement.classList.contains("dark");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const shouldBeDark = storedTheme === "dark" || (!storedTheme && (htmlHasDark || prefersDark));

        setIsDark(shouldBeDark);
        if (shouldBeDark) {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      } catch {}
    };

    syncTheme();

    const handleCustomChange = () => syncTheme();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "theme") syncTheme();
    };

    window.addEventListener("themechange", handleCustomChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("themechange", handleCustomChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
        localStorage.setItem("theme", "light");
      }
      window.dispatchEvent(new Event("themechange"));
    } catch {}
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
      title={isDark ? "الوضع النهاري ☀️" : "الوضع الليلي 🌙"}
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white/95 text-zinc-700 shadow-xs hover:border-red-300 hover:bg-zinc-100 hover:text-red-600 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-amber-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 transition-all cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 rotate-0 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700 dark:text-zinc-300 -rotate-12 hover:rotate-0 transition-transform" />
      )}
    </button>
  );
}

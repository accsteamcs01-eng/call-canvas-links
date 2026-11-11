import { useCallback, useEffect, useState } from "react";

const KEY = "callsim-admin-theme";
export type AdminTheme = "dark" | "light";

/** Applies the admin-only light theme via a class on <html>; removed when the panel unmounts. */
export function useAdminTheme() {
  const [theme, setTheme] = useState<AdminTheme>("dark");
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "light") setTheme("light");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("admin-light", theme === "light");
    return () => document.documentElement.classList.remove("admin-light");
  }, [theme]);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const n = t === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, n);
      return n;
    });
  }, []);
  return { theme, toggle };
}

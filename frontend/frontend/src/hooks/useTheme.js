import { useEffect } from "react";

export default function useTheme() {
  // always dark
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("dark");
    try { localStorage.setItem("theme", "dark"); } catch {}
  }, []);

  return { theme: "dark", toggleTheme: () => {} };
}
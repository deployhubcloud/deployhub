import { useEffect, useState } from "react";
import { applyTheme, readTheme, THEME_STORAGE_KEY } from "../theme";

export default function useTheme() {
  const [theme, setThemeState] = useState(readTheme);
  useEffect(() => {
    const sync = (event) => {
      if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
      const next = readTheme();
      applyTheme(next);
      setThemeState(next);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function setTheme(next) {
    applyTheme(next);
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next.id);
    } catch {
      /* Theme still works when storage is blocked. */
    }
  }
  return { theme, setTheme };
}

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, readTheme, themeKey } from "./theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const next = readTheme();
      applyTheme(next);
      setTheme(next);
    };
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  return (
    <button className="theme-toggle" aria-label={label} title={label} onClick={() => {
      const next = theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(themeKey, next); } catch {}
      applyTheme(next);
      setTheme(next);
    }}>
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

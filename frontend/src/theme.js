export const themeKey = "onlydevops-theme";
const systemTheme = () => "dark";

export function readTheme() {
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return systemTheme();
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
}

applyTheme(readTheme());

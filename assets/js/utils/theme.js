// assets/js/utils/theme.js — Sistema de temas oscuro/claro

const THEME_KEY = "sistema-ventas-theme";
const THEMES = {
  light: "light",
  dark: "dark"
};

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(saved);
}

export function applyTheme(theme) {
  const html = document.documentElement;
  
  if (theme === THEMES.dark) {
    html.classList.add("dark");
    localStorage.setItem(THEME_KEY, THEMES.dark);
  } else {
    html.classList.remove("dark");
    localStorage.setItem(THEME_KEY, THEMES.light);
  }
}

export function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || "light";
  const next = current === THEMES.light ? THEMES.dark : THEMES.light;
  applyTheme(next);
  return next;
}

export function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

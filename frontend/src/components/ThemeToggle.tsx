import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const themeEvent = "mundo-fitness-theme";
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#131316' : '#f6f5f2');
}
function readPreference() {
  try {
    return localStorage.getItem("mf-theme-v1");
  } catch {
    return null;
  }
}
function subscribe(onChange: () => void) {
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  const syncSystem = () => {
    if (readPreference()) return;
    applyTheme(preference.matches ? "dark" : "light");
    onChange();
  };
  const syncStorage = (event: StorageEvent) => {
    if (event.key !== "mf-theme-v1") return;
    applyTheme(
      event.newValue === "dark"
        ? "dark"
        : event.newValue === "light"
          ? "light"
          : preference.matches
            ? "dark"
            : "light");
    onChange();
  };
  window.addEventListener(themeEvent, onChange);
  window.addEventListener("storage", syncStorage);
  preference.addEventListener("change", syncSystem);
  return () => {
    window.removeEventListener(themeEvent, onChange);
    window.removeEventListener("storage", syncStorage);
    preference.removeEventListener("change", syncSystem);
  };
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("mf-theme-v1", next);
    } catch {
      /* Changing the current tab does not require persistent storage. */
    }
    window.dispatchEvent(new Event(themeEvent));
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"
      }
      title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : (
          <path d="M20.8 13a9 9 0 0 1-9.8-9.8A9 9 0 1 0 20.8 13Z" />
        )}
      </svg>
    </button>
  );
}

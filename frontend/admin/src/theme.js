export const THEME_STORAGE_KEY = "deployhub.appearance.v1";

// Light and Dark share semantic color roles with Dashboard-Revamp.
const roles = [
  "bg",
  "surface",
  "subtle",
  "text",
  "muted",
  "line",
  "accent",
  "accent-hover",
  "tint",
  "sidebar",
  "sidebar-text",
  "sidebar-muted",
];
function palette(id, name, description, dark, values) {
  const colors = Object.fromEntries(
    roles.map((role, index) => [role, values[index]]),
  );
  return {
    id,
    name,
    description,
    dark,
    colors: {
      ...colors,
      "on-accent": dark ? "#0a0a0a" : "#ffffff",
      "sidebar-active": colors.tint,
      terminal: "#0a0a0a",
      "terminal-text": "#ededed",
      "terminal-muted": "#a1a1a1",
      success: dark ? "#abd3ba" : "#35694e",
      "success-bg": dark ? "#293c33" : "#e5efe8",
      warning: dark ? "#dec695" : "#805e24",
      "warning-bg": dark ? "#3e3629" : "#f1eadc",
      danger: dark ? "#e0b0af" : "#9a4647",
      "danger-bg": dark ? "#422f34" : "#f3e5e5",
      shadow: dark ? "#00000066" : "#0000000a",
    },
  };
}

export const themes = [
  palette("light", "Light", "Soft whites and neutral greys", false, [
    "#fafafa",
    "#ffffff",
    "#f2f2f2",
    "#171717",
    "#666666",
    "#e5e5e5",
    "#171717",
    "#383838",
    "#ebebeb",
    "#fafafa",
    "#171717",
    "#666666",
  ]),
  palette("dark", "Dark", "True black and neutral greys", true, [
    "#000000",
    "#0a0a0a",
    "#171717",
    "#ededed",
    "#a1a1a1",
    "#2e2e2e",
    "#ededed",
    "#ffffff",
    "#1f1f1f",
    "#0a0a0a",
    "#ededed",
    "#a1a1a1",
  ]),
];

const defaultTheme = themes.find((theme) => theme.id === "dark");
const legacyLightThemes = new Set([
  "mist",
  "paper",
  "sage",
  "ocean",
  "lavender",
  "rose",
  "sand",
]);

export function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const id = legacyLightThemes.has(stored) ? "light" : stored;
    const resolved = themes.find((theme) => theme.id === id) || defaultTheme;
    if (stored && stored !== resolved.id) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, resolved.id);
      } catch {
        /* Keep the resolved theme when storage writes are blocked. */
      }
    }
    return resolved;
  } catch {
    return defaultTheme;
  }
}

let themeFrame;

export function applyTheme(theme) {
  const root = document.documentElement;
  // Change foregrounds and backgrounds together, including controls with hover transitions.
  cancelAnimationFrame(themeFrame);
  root.classList.add("theme-changing");
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.dark ? "dark" : "light";
  root.style.colorScheme = theme.dark ? "dark" : "light";
  for (const [role, color] of Object.entries(theme.colors))
    root.style.setProperty(`--theme-${role}`, color);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.colors.bg);
  themeFrame = requestAnimationFrame(() => {
    themeFrame = requestAnimationFrame(() =>
      root.classList.remove("theme-changing"),
    );
  });
}

// Apply the saved theme before React mounts to avoid a flash of another theme.
applyTheme(readTheme());

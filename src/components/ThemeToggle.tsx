import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

// SVG icons inline to avoid dependencies
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const LaptopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  </svg>
);

function getStoredTheme(): Theme {
  if (typeof document === "undefined") return "system";
  const match = document.cookie.match(/en_theme=(light|dark)/);
  return (match?.[1] as Theme) ?? "system";
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export default function ThemeToggle({
  initialTheme,
}: {
  initialTheme?: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? "system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Read theme from cookie on mount
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleToggle = async () => {
    const nextTheme: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";

    // Optimistic update
    setTheme(nextTheme);
    applyTheme(nextTheme);

    // Persist to server
    const formData = new FormData();
    formData.append("theme", nextTheme);

    try {
      await fetch("/api/theme-switch", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // SSR fallback - show system theme icon (visible, just not interactive)
  if (!mounted) {
    return (
      <button
        type="button"
        className="flex size-5 cursor-pointer items-center justify-center text-gray-600 dark:text-gray-400"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <LaptopIcon />
      </button>
    );
  }

  const icons = {
    light: <SunIcon />,
    dark: <MoonIcon />,
    system: <LaptopIcon />,
  };

  const labels = {
    light: "Switch to dark mode",
    dark: "Switch to system theme",
    system: "Switch to light mode",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex size-5 cursor-pointer items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus-ring-primary"
      aria-label={labels[theme]}
      title={labels[theme]}
    >
      {icons[theme]}
    </button>
  );
}

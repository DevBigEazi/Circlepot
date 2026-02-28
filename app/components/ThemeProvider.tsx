"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type AppliedTheme = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  appliedTheme: AppliedTheme;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Possible values: 'light', 'dark', 'system'
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  // Actual applied theme: 'light' or 'dark'
  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>("light");

  // Only run on client after mount to prevent hydration mismatch
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-mode") as ThemeMode | null;

    const initialMode = savedTheme || "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeMode(initialMode);

    if (initialMode === "dark") setAppliedTheme("dark");
    else if (initialMode === "light") setAppliedTheme("light");
    else {
      // system
      setAppliedTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (theme: AppliedTheme): void => {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      setAppliedTheme(theme);
    };

    const getSystemTheme = (): AppliedTheme => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    if (themeMode === "system") {
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent): void => {
        if (themeMode === "system") {
          applyTheme(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      applyTheme(themeMode as AppliedTheme);
    }
  }, [themeMode]);

  const setTheme = (mode: ThemeMode): void => {
    setThemeMode(mode);
    localStorage.setItem("theme-mode", mode);
  };

  const value: ThemeContextType = {
    themeMode, // 'light', 'dark', or 'system'
    appliedTheme, // actual theme being displayed: 'light' or 'dark'
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

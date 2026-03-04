"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useThemeColors } from "../hooks/useThemeColors";

const ThemeToggle = () => {
  const { themeMode, setTheme } = useTheme();
  const colors = useThemeColors();

  const modes = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div
      className="flex p-1 rounded-2xl border"
      style={{ backgroundColor: colors.background, borderColor: colors.border }}
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = themeMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => setTheme(mode.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all"
            style={{
              backgroundColor: isActive ? colors.surface : "transparent",
              color: isActive ? colors.primary : colors.textLight,
              boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
            }}
          >
            <Icon size={16} />
            <span className="text-xs font-bold">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;

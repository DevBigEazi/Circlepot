"use client";

import { useThemeColors } from "../hooks/useThemeColors";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickAction() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4" style={{ color: colors.text }}>
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => router.push("/browse")}
          className="p-5 rounded-2xl border flex items-center justify-between group transition-all duration-300 hover:scale-[1.02] shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-xl transition-colors duration-300 group-hover:bg-primary/20"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Search size={22} style={{ color: colors.primary }} />
            </div>
            <div className="text-left">
              <div
                className="text-base font-bold"
                style={{ color: colors.text }}
              >
                Browse Circles
              </div>
              <div
                className="text-sm opacity-60"
                style={{ color: colors.text }}
              >
                Discover and join existing savings pools
              </div>
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <Search size={16} style={{ color: colors.primary }} />
          </div>
        </button>
      </div>
    </div>
  );
}

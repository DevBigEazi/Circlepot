"use client";

import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";
import { Target, Users } from "lucide-react";
import QuickAction from "@/app/components/QuickAction";

export default function CreatePage() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="What would you like to create ?"
        subtitle="Choose an option to start saving"
        onBack={() => router.back()}
        colors={colors}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Personal Goal Option */}
          <button
            onClick={() => router.push("/create/personal-goal")}
            className="p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.03] text-left group"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="p-4 rounded-2xl mb-4 transition-colors duration-300 group-hover:bg-primary/20"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Target size={40} style={{ color: colors.primary }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                Personal Goal
              </h3>
              <p
                className="text-center text-sm mb-6 opacity-60"
                style={{ color: colors.text }}
              >
                Set and track your individual savings targets
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Solo Saving
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Custom Timeline
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.primary + "20",
                    color: colors.primary,
                  }}
                >
                  Yield Enabled
                </span>
              </div>
            </div>
          </button>

          {/* Create Savings Circle Option */}
          <button
            onClick={() => router.push("/create/circle")}
            className="p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.03] text-left group"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className="p-4 rounded-2xl mb-4 transition-colors duration-300 group-hover:bg-secondary/20"
                style={{ backgroundColor: `${colors.secondary}15` }}
              >
                <Users size={40} style={{ color: colors.secondary }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: colors.text }}
              >
                Savings Circle
              </h3>
              <p
                className="text-center text-sm mb-6 opacity-60"
                style={{ color: colors.text }}
              >
                Create a group savings pool with friends
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Group Saving
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Shared Goals
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: colors.warningBg,
                    color: colors.secondary,
                  }}
                >
                  Reputation Mode
                </span>
              </div>
            </div>
          </button>
        </div>

        <QuickAction />
      </div>
    </div>
  );
}

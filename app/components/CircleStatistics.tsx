"use client";

import React from "react";
import { Users, TrendingUp, Award, AlertCircle } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface CircleStatisticsProps {
  activeCircles: number;
  totalSaved: string; // Collateral + Contributions
  totalPayouts: string; // Payouts received
  totalPenalties: string; // Late fees + Forfeitures
  reputation: number;
}

export const CircleStatistics: React.FC<CircleStatisticsProps> = ({
  activeCircles,
  totalSaved,
  totalPayouts,
  totalPenalties,
  reputation,
}) => {
  const colors = useThemeColors();

  const stats = [
    {
      label: "Active Circles",
      value: activeCircles.toString(),
      icon: <Users size={16} />,
      color: colors.primary,
    },
    {
      label: "Circle Savings",
      value: `$${Number(totalSaved).toLocaleString()}`,
      description: "Collateral + Contributions",
      icon: <TrendingUp size={16} />,
      color: "#10b981",
    },
    {
      label: "Total Payouts",
      value: `$${Number(totalPayouts).toLocaleString()}`,
      icon: <Award size={16} />,
      color: colors.primary,
    },
    {
      label: "Trust Score",
      value: reputation.toString(),
      icon: <Award size={16} />,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-300 min-w-0 flex flex-col justify-between"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="p-1.5 sm:p-2 rounded-xl"
              style={{ backgroundColor: `${card.color}15`, color: card.color }}
            >
              {card.icon}
            </div>
            {Number(totalPenalties) > 0 && card.label === "Circle Savings" && (
              <div className="flex items-center gap-0.5 text-[8px] sm:text-[9px] font-black underline decoration-red-500/30 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                <AlertCircle size={10} />
                -${Number(totalPenalties).toLocaleString()}
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40 truncate block">
              {card.label}
            </span>
            <div
              className="text-lg sm:text-2xl font-black tracking-tight truncate leading-none"
              style={{ color: colors.text }}
            >
              {card.value}
            </div>
            {card.description && (
              <span className="text-[8px] sm:text-[9px] font-medium opacity-30 block truncate">
                {card.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

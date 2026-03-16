"use client";

import React from "react";
import { Users, TrendingUp, Award } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface CircleStatisticsProps {
  activeCircles: number;
  totalSaved: string; // Collateral + Contributions
  totalPayouts: string; // Payouts received
  reputation: number;
}

export const CircleStatistics: React.FC<CircleStatisticsProps> = ({
  activeCircles,
  totalSaved,
  totalPayouts,
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
      value: `${Number(totalSaved) < 0 ? "-" : ""}$${Math.abs(Number(totalSaved)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Net Balance (Paid - Payouts)",
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
    <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth snap-x snap-mandatory">
      {stats.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col justify-between shrink-0 w-[85%] sm:w-[300px] snap-center min-h-[120px] sm:min-h-[140px]"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest opacity-40 truncate">
                {card.label}
              </span>
              {card.description && (
                <span className="text-[8px] sm:text-[10px] font-medium opacity-30 truncate">
                  {card.description}
                </span>
              )}
            </div>
            <div
              className="p-2 sm:p-2.5 rounded-xl shrink-0"
              style={{ backgroundColor: `${card.color}15`, color: card.color }}
            >
              {card.icon}
            </div>
          </div>
          <div
            className="text-sm sm:text-3xl font-black tracking-tight"
            style={{ color: colors.text }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

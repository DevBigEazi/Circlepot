"use client";

import React, { useState } from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";

export default function SavingsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");

  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "group", label: "Group" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="tabs"
        title="My Savings"
        subtitle={
          activeTab === "personal" ? "Individual Goals" : "Savings Circles"
        }
        onBack={() => router.back()}
        colors={colors}
      />

      {/* Tab Switcher Area */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div
          className="flex p-1 rounded-2xl"
          style={{ backgroundColor: `${colors.surface}` }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300"
                style={
                  isActive
                    ? {
                        backgroundColor: colors.background,
                        color: colors.primary,
                        shadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }
                    : { color: colors.text, opacity: 0.5 }
                }
              >
                {tab.id === "personal" ? (
                  <User size={18} />
                ) : (
                  <Users size={18} />
                )}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === "personal" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              Personal Goals
            </h2>
            <p style={{ color: colors.text, opacity: 0.7 }}>
              Track your individual savings milestones.
            </p>
            {/* Component for Personal Goals will go here */}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              Group Circles
            </h2>
            <p style={{ color: colors.text, opacity: 0.7 }}>
              Save together with your community.
            </p>
            {/* Component for Group Circles will go here */}
          </div>
        )}
      </div>
    </div>
  );
}

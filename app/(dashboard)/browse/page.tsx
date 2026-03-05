"use client";

import React from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";

export default function BrowsePage() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Browse"
        onBack={() => router.back()}
        colors={colors}
      />
      <div className="p-3 sm:p-4">
        <p
          className="text-sm sm:text-base opacity-70"
          style={{ color: colors.text }}
        >
          Browse circles and opportunities.
        </p>
      </div>
    </div>
  );
}

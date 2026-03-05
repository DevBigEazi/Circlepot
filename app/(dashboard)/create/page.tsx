"use client";

import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";

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
        title="Create"
        onBack={() => router.back()}
        colors={colors}
      />
      <div className="p-4">
        <p style={{ color: colors.text, opacity: 0.7 }}>
          Create a new savings circle.
        </p>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import NavBar from "@/app/components/NavBar";
import { History, Bell, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const colors = useThemeColors();
  const { profile } = useUserProfile();
  const router = useRouter();

  const actions = (
    <div className="flex gap-2">
      <button
        onClick={() => router.push("/transactions-history")}
        className="p-2 rounded-xl transition hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: colors.text }}
      >
        <History size={18} />
      </button>
      <button
        onClick={() => router.push("/notifications")}
        className="p-2 rounded-xl relative transition hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: colors.text }}
      >
        <Bell size={18} />
      </button>
      <button
        onClick={() => router.push("/settings")}
        className="p-2 rounded-xl transition hover:bg-black/5 dark:hover:bg-white/5"
        style={{ color: colors.text }}
      >
        <Settings size={18} />
      </button>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        colors={colors}
        userName={profile?.username}
        fullName={`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()}
        profileImage={profile?.profilePhoto}
        actions={actions}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
          Welcome to Circlepot
        </h1>
        <p style={{ color: colors.text, opacity: 0.7 }}>
          Your social savings journey starts here.
        </p>
      </div>
    </div>
  );
}

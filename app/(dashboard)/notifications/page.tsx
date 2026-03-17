"use client";

import { useNotifications } from "@/app/components/NotificationsProvider";
import { NotificationList } from "@/app/components/NotificationList";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useRouter } from "next/navigation";
import NavBar from "@/app/components/NavBar";
import { CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const { markAllAsRead, unreadCount } = useNotifications();

  const actions = unreadCount > 0 ? (
    <button
      onClick={() => markAllAsRead()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 border"
      style={{ color: colors.primary, borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}10` }}
    >
      <CheckCheck size={14} />
      Mark all read
    </button>
  ) : null;

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Notifications"
        onBack={() => router.back()}
        colors={colors}
        actions={actions}
      />
      <main className="max-w-4xl mx-auto p-4">
        <NotificationList />
      </main>
    </div>
  );
}

"use client";

import { useNotifications } from "@/app/components/NotificationsProvider";
import { NotificationList } from "@/app/components/NotificationList";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useRouter } from "next/navigation";
import NavBar from "@/app/components/NavBar";
import { CheckCheck, Bell, Users, Target, Trophy, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

type TabId = "all" | "circles" | "goals" | "reward" | "credit_score";

export default function NotificationsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const { markAllAsRead, unreadCount, notifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const tabs = [
    { id: "all" as const, label: "All", icon: Bell },
    { id: "circles" as const, label: "Circles", icon: Users },
    { id: "goals" as const, label: "Goals", icon: Target },
    { id: "reward" as const, label: "Reward", icon: Trophy },
    { id: "credit_score" as const, label: "Credit Score", icon: TrendingUp },
  ];

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "circles":
        return notifications.filter(n => 
          n.type.startsWith("circle_") || 
          n.type === "contribution_due" || 
          n.type.startsWith("vote_") || 
          n.type.startsWith("member_") || 
          n.type === "late_payment_warning" || 
          n.type === "position_assigned" ||
          n.type === "circle_joined" ||
          n.type === "circle_voting" ||
          n.type === "circle_invite" ||
          n.type === "invite_accepted"
        );
      case "goals":
        return notifications.filter(n => n.type.startsWith("goal_"));
      case "reward":
        return notifications.filter(n => 
          n.type === "referral_reward" || 
          n.type === "payment_received" || 
          n.type === "collateral_returned"
        );
      case "credit_score":
        return notifications.filter(n => n.type === "credit_score_changed");
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const emptyStateContent = useMemo(() => {
    switch (activeTab) {
      case "circles":
        return {
          title: "No Circle updates",
          message: "When you join circles or receive updates about your savings circles, they'll appear here."
        };
      case "goals":
        return {
          title: "No Goal updates",
          message: "Track your personal savings progress and milestones here."
        };
      case "reward":
        return {
          title: "No Rewards yet",
          message: "Referral bonuses and other rewards will be listed in this tab."
        };
      case "credit_score":
        return {
          title: "Credit Score is stable",
          message: "We'll notify you here when your credit score changes based on your saving habits."
        };
      default:
        return {
          title: "No notifications yet",
          message: "When you receive updates about your circles, goals, or referrals, they'll appear here."
        };
    }
  }, [activeTab]);

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
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar -mx-4 px-4">
          <div 
            className="flex p-1 rounded-2xl bg-opacity-50 min-w-max"
            style={{ backgroundColor: `${colors.surface}` }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 text-xs whitespace-nowrap"
                  style={
                    isActive
                      ? {
                          backgroundColor: colors.background,
                          color: colors.primary,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }
                      : { color: colors.text, opacity: 0.5 }
                  }
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <NotificationList 
          notifications={filteredNotifications}
          emptyTitle={emptyStateContent.title}
          emptyMessage={emptyStateContent.message}
        />
      </main>
    </div>
  );
}

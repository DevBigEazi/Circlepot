"use client";

import React from "react";
import { useNotifications } from "./NotificationsProvider";
import { useThemeColors } from "../hooks/useThemeColors";
import { 
  Bell, 
  CircleDollarSign, 
  Users, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  Trophy,
  ArrowRight
} from "lucide-react";
import { NotificationType } from "../types/notifications";
import { useRouter } from "next/navigation";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case "circle_payout":
    case "payment_received":
    case "referral_reward":
    case "collateral_returned":
      return <CircleDollarSign size={18} className="text-green-500" />;
    case "circle_member_joined":
    case "circle_invite":
    case "invite_accepted":
      return <Users size={18} className="text-blue-500" />;
    case "goal_completed":
    case "goal_milestone":
    case "circle_completed":
    case "circle_started":
      return <Trophy size={18} className="text-yellow-500" />;
    case "contribution_due":
    case "goal_contribution_due":
    case "late_payment_warning":
    case "payment_late":
    case "member_forfeited":
      return <AlertTriangle size={18} className="text-red-500" />;
    case "vote_required":
    case "circle_voting":
    case "vote_executed":
      return <Info size={18} className="text-indigo-500" />;
    case "circle_member_contributed":
    case "circle_contribution_self":
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    default:
      return <Bell size={18} className="text-gray-500" />;
  }
};

export const NotificationList: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const colors = useThemeColors();
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <Bell size={32} style={{ color: colors.primary }} className="opacity-40" />
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: colors.text }}>
          No notifications yet
        </h3>
        <p className="text-sm opacity-60 max-w-xs" style={{ color: colors.text }}>
          When you receive updates about your circles, goals, or referrals, they&apos;ll appear here.
        </p>
      </div>
    );
  }

  const handleNotificationClick = (id: string, url?: string, read?: boolean) => {
    if (!read) {
      markAsRead(id);
    }
    if (url) {
      router.push(url);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative p-4 rounded-2xl border transition-all duration-300 group ${!notification.read ? 'shadow-sm' : 'opacity-80'} ${notification.url ? 'cursor-pointer hover:shadow-md' : ''}`}
          style={{ 
            backgroundColor: colors.surface,
            borderColor: !notification.read ? `${colors.primary}40` : colors.border,
          }}
          onClick={() => handleNotificationClick(notification.id, notification.url, notification.read)}
        >
          {!notification.read && (
            <div 
              className="absolute top-4 right-4 w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
          )}
          
          <div className="flex gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <NotificationIcon type={notification.type} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 
                  className={`text-sm font-bold truncate pr-4 ${!notification.read ? '' : 'opacity-80'}`} 
                  style={{ color: colors.text }}
                >
                  {notification.title}
                </h4>
                <span className="text-[10px] opacity-60 shrink-0" style={{ color: colors.text }}>
                  {notification.timeAgo}
                </span>
              </div>
              
              <p 
                className="text-xs leading-relaxed opacity-70 mb-3" 
                style={{ color: colors.text }}
              >
                {notification.message}
              </p>
              
              {notification.url && (
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2"
                  style={{ color: colors.primary }}
                >
                  View Details
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

"use client";

import React from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useRouter } from "next/navigation";
import NavBar from "@/app/components/NavBar";
import { useNotifications } from "@/app/components/NotificationsProvider";
import { NotificationPreferences } from "@/app/types/notifications";
import { ThemeColors } from "@/app/hooks/useThemeColors";
import { 
  LucideIcon,
  Bell, 
  Smartphone, 
  CircleDollarSign, 
  Users, 
  Target, 
  Shield, 
  Info
} from "lucide-react";

const SettingToggle = ({ 
  label, 
  description, 
  enabled, 
  onToggle, 
  colors,
  icon: Icon
}: { 
  label: string; 
  description?: string; 
  enabled: boolean; 
  onToggle: () => void; 
  colors: ThemeColors;
  icon?: LucideIcon;
}) => (
  <div className="flex items-center justify-between py-4 group">
    <div className="flex gap-3 sm:gap-4 flex-1">
      {Icon && (
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${colors.primary}10` }}
        >
          <Icon size={18} style={{ color: colors.primary }} />
        </div>
      )}
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-bold" style={{ color: colors.text }}>{label}</h4>
        {description && (
          <p className="text-xs opacity-60 mt-0.5" style={{ color: colors.text }}>{description}</p>
        )}
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out outline-none focus:ring-2 focus:ring-offset-2 ${enabled ? '' : 'bg-gray-200'}`}
      style={{ 
        backgroundColor: enabled ? colors.primary : undefined,
        boxShadow: enabled ? `0 4px 12px ${colors.primary}40` : 'none'
      }}
    >
      <div 
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  </div>
);

const SettingSection = ({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) => (
  <div 
    className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border shadow-sm mb-4 sm:mb-6"
    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
  >
    <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 opacity-40">
      {title}
    </h3>
    <div className="divide-y divide-gray-100 dark:divide-white/5">
      {children}
    </div>
  </div>
);

export default function NotificationSettingsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const { 
    preferences, 
    updatePreferences, 
    togglePushNotifications, 
    isPushSupported, 
    isSubscribed 
  } = useNotifications();

  const handleToggle = (key: keyof NotificationPreferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Notification Settings"
        onBack={() => router.back()}
        colors={colors}
      />

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
        {/* Master Controls */}
        <SettingSection title="Global Settings" colors={colors}>
          <SettingToggle
            label="In-App Notifications"
            description="Show alerts within the application"
            enabled={preferences.inAppEnabled}
            onToggle={() => handleToggle('inAppEnabled')}
            colors={colors}
            icon={Bell}
          />
          <SettingToggle
            label="Push Notifications"
            description={!isPushSupported ? "Not supported by your browser" : "Receive alerts even when the app is closed"}
            enabled={preferences.pushEnabled && isSubscribed}
            onToggle={() => isPushSupported && togglePushNotifications()}
            colors={colors}
            icon={Smartphone}
          />
        </SettingSection>

        {/* Circle Settings */}
        <SettingSection title="Circle Updates" colors={colors}>
          <SettingToggle
            label="Circle Activity"
            description="When members join, contribute, or withdraw"
            enabled={preferences.circleMemberJoined}
            onToggle={() => {
              const val = !preferences.circleMemberJoined;
              updatePreferences({
                circleMemberJoined: val,
                circleMemberContributed: val,
                circleMemberWithdrew: val
              });
            }}
            colors={colors}
            icon={Users}
          />
          <SettingToggle
            label="Payouts & Payments"
            description="When you or others receive payouts"
            enabled={preferences.paymentReceived}
            onToggle={() => handleToggle('paymentReceived')}
            colors={colors}
            icon={CircleDollarSign}
          />
          <SettingToggle
            label="Voting Alerts"
            description="When a vote is required or executed"
            enabled={preferences.circleVoting}
            onToggle={() => handleToggle('circleVoting')}
            colors={colors}
            icon={Info}
          />
        </SettingSection>

        {/* Goal Settings */}
        <SettingSection title="Personal Goals" colors={colors}>
          <SettingToggle
            label="Goal Milestones"
            description="When you reach a saving milestone"
            enabled={preferences.goalMilestone}
            onToggle={() => handleToggle('goalMilestone')}
            colors={colors}
            icon={Target}
          />
          <SettingToggle
            label="Deadlines & Reminders"
            description="Reminders as your deadlines approach"
            enabled={preferences.goalDeadline1Day}
            onToggle={() => {
              const val = !preferences.goalDeadline1Day;
              updatePreferences({
                goalDeadline1Day: val,
                goalDeadline2Days: val,
                goalReminder: val
              });
            }}
            colors={colors}
            icon={Bell}
          />
        </SettingSection>

        {/* Referral Settings */}
        <SettingSection title="Rewards & Referrals" colors={colors}>
          <SettingToggle
            label="Referral Rewards"
            description="When you earn a referral bonus"
            enabled={preferences.referralReward}
            onToggle={() => handleToggle('referralReward')}
            colors={colors}
            icon={CircleDollarSign}
          />
        </SettingSection>

        {/* Security Settings */}
        <SettingSection title="System & Security" colors={colors}>
          <SettingToggle
            label="Security Alerts"
            description="Critical alerts regarding your account"
            enabled={preferences.securityAlert}
            onToggle={() => handleToggle('securityAlert')}
            colors={colors}
            icon={Shield}
          />
        </SettingSection>

        <p className="text-center text-[10px] opacity-40 mt-8 px-4" style={{ color: colors.text }}>
          Some critical system updates and security alerts cannot be disabled to ensure account safety.
        </p>
      </main>
    </div>
  );
}

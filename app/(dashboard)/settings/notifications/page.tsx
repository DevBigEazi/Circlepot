"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useAccountAddress } from "@/app/hooks/useAccountAddress";
import NavBar from "@/app/components/NavBar";
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscriptionStatus,
} from "@/app/utils/pushNotificationManager";
import type { NotificationPreferences } from "@/app/types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/app/types/notifications";

// ─── Grouped notification settings (maps to audited preference keys) ──────────
interface PreferenceItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}

interface PreferenceGroup {
  title: string;
  items: PreferenceItem[];
}

const PREFERENCE_GROUPS: PreferenceGroup[] = [
  {
    title: "Circle Activity",
    items: [
      { key: "circleJoined",            label: "You joined a circle",           description: "When your membership is confirmed" },
      { key: "circleStarted",           label: "Circle started",                description: "When a circle you're in begins its first round" },
      { key: "circleCompleted",         label: "Circle completed",              description: "When all rounds finish successfully" },
      { key: "circleDead",              label: "Circle marked as dead",         description: "When a circle fails due to member defaults" },
      { key: "circleMemberJoined",      label: "New member joined",             description: "When someone joins a circle you're in" },
      { key: "circleMemberContributed", label: "Member contributed",            description: "When another member makes their payment" },
      { key: "circleMemberPayout",      label: "Member received payout",        description: "When another member's payout is distributed" },
      { key: "circleInvite",            label: "Circle invite",                 description: "When someone invites you to join a circle" },
    ],
  },
  {
    title: "Payments & Deadlines",
    items: [
      { key: "contributionDue",         label: "Contribution due",             description: "Reminder when your payment deadline is approaching" },
      { key: "latePaymentWarning",      label: "Late payment warning",         description: "When your contribution is overdue (late fee applies)" },
      { key: "paymentReceived",         label: "Payout received",              description: "When your turn payout is sent to your wallet" },
      { key: "paymentLate",             label: "Late payment recorded",        description: "When a late payment is recorded on your reputation" },
      { key: "collateralReturned",      label: "Collateral returned",          description: "When your locked collateral is returned after circle ends" },
    ],
  },
  {
    title: "Voting",
    items: [
      { key: "voteRequired",            label: "Vote required",                description: "When a circle you're in starts a vote" },
      { key: "voteExecuted",            label: "Vote result",                  description: "When a vote has been finalised" },
      { key: "circleVoting",            label: "Member voted",                 description: "When another member casts their vote" },
    ],
  },
  {
    title: "Positions",
    items: [
      { key: "positionAssigned",        label: "Payout position assigned",     description: "When your payout order is set at circle start" },
      { key: "memberForfeited",         label: "Member forfeited",             description: "When a member is forfeited in your circle" },
    ],
  },
  {
    title: "Personal Goals",
    items: [
      { key: "goalContributionDue",     label: "Goal contribution due",        description: "Reminder when your goal payment is approaching" },
      { key: "goalDeadline2Days",       label: "Goal deadline (2 days)",       description: "Two-day warning before your goal's final deadline" },
      { key: "goalDeadline1Day",        label: "Goal deadline (1 day)",        description: "One-day warning before your goal's final deadline" },
      { key: "goalCompleted",           label: "Goal completed",               description: "When you successfully complete and withdraw a goal" },
    ],
  },
  {
    title: "Reputation & Referrals",
    items: [
      { key: "creditScoreChanged",      label: "Credit score changed",         description: "When your trust score goes up or down" },
      { key: "referralReward",          label: "Referral reward paid",         description: "When you earn a reward for referring someone" },
    ],
  },
];

// ─── Toggle Component ─────────────────────────────────────────────────────────
interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  primaryColor: string;
}

function Toggle({ enabled, onChange, disabled, primaryColor }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: enabled ? primaryColor : "#d1d5db" }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationSettingsPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { address } = useAccountAddress();

  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  // ── Initialise state from profile + browser subscription status ───────────
  useEffect(() => {
    setIsPushSupported(isPushNotificationSupported());
    getPushSubscriptionStatus().then(({ isSubscribed }) => {
      setIsPushEnabled(isSubscribed);
    });
  }, []);

  useEffect(() => {
    if (profile?.notificationPreferences) {
      setPrefs({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...profile.notificationPreferences });
    }
  }, [profile]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePushToggle = useCallback(async () => {
    if (!address) return;
    setPushLoading(true);
    try {
      if (isPushEnabled) {
        await unsubscribeFromPushNotifications(address);
        setIsPushEnabled(false);
        toast.success("Push notifications disabled");
      } else {
        await subscribeToPushNotifications(address, prefs);
        setIsPushEnabled(true);
        toast.success("Push notifications enabled");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setPushLoading(false);
    }
  }, [isPushEnabled, address, prefs]);

  const handlePrefToggle = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!address) return;
      const updated = { ...prefs, [key]: value };
      setPrefs(updated);
      setSavingKey(key);
      try {
        const res = await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address, preferences: updated }),
        });
        if (!res.ok) throw new Error("Failed to save preference");
      } catch {
        // Rollback on failure
        setPrefs((prev) => ({ ...prev, [key]: !value }));
        toast.error("Failed to save preference");
      } finally {
        setSavingKey(null);
      }
    },
    [address, prefs]
  );

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: colors.background }}>
      <NavBar
        variant="minimal"
        title="Notifications"
        onBack={() => router.back()}
        colors={colors}
      />

      <div className="max-w-2xl mx-auto px-2 sm:px-4 space-y-4 mt-4 sm:mt-6">

        {/* ── Global Push Toggle ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 border shadow-sm"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: colors.accentBg }}
              >
                {isPushEnabled
                  ? <Bell size={20} style={{ color: colors.primary }} />
                  : <BellOff size={20} style={{ color: colors.textLight }} />
                }
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: colors.text }}>
                  Push Notifications
                </p>
                <p className="text-xs opacity-60 mt-0.5" style={{ color: colors.text }}>
                  {isPushSupported
                    ? "Receive alerts on this device"
                    : "Not supported on this browser"}
                </p>
              </div>
            </div>
            {pushLoading
              ? <Loader2 size={20} className="animate-spin" style={{ color: colors.primary }} />
              : (
                <Toggle
                  enabled={isPushEnabled}
                  onChange={handlePushToggle}
                  disabled={!isPushSupported}
                  primaryColor={colors.primary}
                />
              )
            }
          </div>

          {isPushEnabled && (
            <p
              className="text-xs mt-4 pt-4 border-t opacity-50"
              style={{ color: colors.text, borderColor: colors.border }}
            >
              Manage which notifications you receive below. Changes save instantly.
            </p>
          )}
        </div>

        {/* ── Grouped Preferences ────────────────────────────────────────── */}
        {PREFERENCE_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl sm:rounded-3xl px-3.5 py-5 sm:p-7 border shadow-sm"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <h3
              className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 opacity-40"
              style={{ color: colors.text }}
            >
              {group.title}
            </h3>

            <div className="divide-y" style={{ borderColor: colors.border }}>
              {group.items.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: colors.text }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-xs opacity-50 mt-0.5 leading-snug"
                      style={{ color: colors.text }}
                    >
                      {description}
                    </p>
                  </div>
                  {savingKey === key
                    ? <Loader2 size={16} className="animate-spin shrink-0" style={{ color: colors.primary }} />
                    : (
                      <Toggle
                        enabled={prefs[key] as boolean}
                        onChange={(val) => handlePrefToggle(key, val)}
                        disabled={!isPushEnabled}
                        primaryColor={colors.primary}
                      />
                    )
                  }
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useAccountAddress } from "../hooks/useAccountAddress";
import type {
  Notification,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from "../types/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../types/notifications";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  updateNotificationPreferences,
  isPushNotificationSupported,
  getPushSubscriptionStatus,
} from "../utils/pushNotificationManager";

interface NotificationsContextType {
  notifications: Notification[];
  notificationsEnabled: boolean;
  pushEnabled: boolean;
  isPushSupported: boolean;
  isSubscribed: boolean;
  preferences: NotificationPreferences;
  unreadCount: number;

  // Notification management
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Settings management
  toggleNotifications: (enabled: boolean) => void;
  togglePushNotifications: () => Promise<void>;
  updatePreferences: (
    newPreferences: Partial<NotificationPreferences>,
  ) => Promise<void>;

  // Utility to get real-time timeAgo
  getTimeAgo: (timestamp: number) => string;
  refetchNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const STORAGE_KEY = "Circlepot_notifications";
const PREFERENCES_KEY = "Circlepot_notification_preferences";

// Helper function to serialize notifications with BigInt support
const serializeNotifications = (notifications: Notification[]): string => {
  return JSON.stringify(notifications, (_key, value) => {
    if (typeof value === "bigint") {
      return value.toString() + "n"; // Mark as BigInt with 'n' suffix
    }
    return value;
  });
};

// Helper function to calculate time ago
const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

interface BackendNotification {
  _id: string;
  title: string;
  message?: string;
  body?: string;
  type: string;
  priority?: string;
  createdAt: string;
  read: boolean;
  url?: string;
  data?: Record<string, unknown>;
}

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { address, isInitializing: isAccountInitializing } =
    useAccountAddress();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        try {
          return {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...JSON.parse(stored),
          };
        } catch {
          return DEFAULT_NOTIFICATION_PREFERENCES;
        }
      }
    }
    return DEFAULT_NOTIFICATION_PREFERENCES;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported] = useState(() => isPushNotificationSupported());

  // Initialize data from localStorage or external systems
  useEffect(() => {
    // Other initialization if needed
  }, []);

  // Fetch notifications from the backend history
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!address || isAccountInitializing) return;
      try {
        const res = await fetch(`/api/notifications?userAddress=${address.toLowerCase()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            const fetchedNotifications: Notification[] = (data.notifications as BackendNotification[]).map((n) => ({
              id: n._id,
              title: n.title,
              message: n.message || n.body || "",
              type: n.type as NotificationType,
              priority: (n.priority as NotificationPriority) || "medium",
              timestamp: new Date(n.createdAt).getTime(),
              read: n.read,
              url: n.url,
              timeAgo: getTimeAgo(new Date(n.createdAt).getTime()),
              data: n.data,
            }));
            setNotifications(fetchedNotifications);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notification history:", err);
      }
    };

    if (address && !isAccountInitializing) {
      fetchNotifications();
      // Polling every 60 seconds
      const pollInterval = setInterval(fetchNotifications, 60000);
      
      // Refresh on window focus
      const handleFocus = () => fetchNotifications();
      window.addEventListener("focus", handleFocus);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [address, isAccountInitializing]);

  const refetchNotifications = useCallback(async () => {
    if (!address || isAccountInitializing) return;
    try {
      const res = await fetch(`/api/notifications?userAddress=${address.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedNotifications: Notification[] = (data.notifications as BackendNotification[]).map((n) => ({
            id: n._id,
            title: n.title,
            message: n.message || n.body || "",
            type: n.type as NotificationType,
            priority: (n.priority as NotificationPriority) || "medium",
            timestamp: new Date(n.createdAt).getTime(),
            read: n.read,
            url: n.url,
            timeAgo: getTimeAgo(new Date(n.createdAt).getTime()),
            data: n.data,
          }));
          setNotifications(fetchedNotifications);
        }
      }
    } catch (err) {
      console.error("Failed to fetch notification history manually:", err);
    }
  }, [address, isAccountInitializing]);

  // Check push subscription status on mount and account change
  useEffect(() => {
    if (address && isPushSupported && !isAccountInitializing) {
      getPushSubscriptionStatus().then(({ isSubscribed }) => {
        setIsSubscribed(isSubscribed);
      });
    }
  }, [address, isPushSupported, isAccountInitializing]);

  // Update timeAgo for all notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          timeAgo: getTimeAgo(n.timestamp),
        })),
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          serializeNotifications(notifications),
        );
      } catch {
        // Silently fail if local storage is full
      }
    }
  }, [notifications]);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    }
  }, [preferences]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (
      notification: Omit<Notification, "id" | "timestamp" | "read" | "timeAgo">,
    ) => {
      if (!preferences.inAppEnabled) {
        return;
      }

      const prefKey = getPrefKeyFromType(notification.type);
      if (prefKey && !preferences[prefKey]) {
        return;
      }

      const timestamp = Date.now();
      const uniqueId = `${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id: uniqueId,
        timestamp,
        timeAgo: getTimeAgo(timestamp),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
    },
    [preferences],
  );

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    if (address) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: address.toLowerCase(),
            notificationId: id,
          }),
        });
      } catch (err) {
        console.error("Failed to sync read status:", err);
      }
    }
  }, [address]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (address) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: address.toLowerCase(),
            all: true,
          }),
        });
      } catch (err) {
        console.error("Failed to sync read status:", err);
      }
    }
  }, [address]);

  const toggleNotifications = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, inAppEnabled: enabled }));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const togglePushNotifications = useCallback(async () => {
    if (!address || isAccountInitializing) {
      return;
    }

    if (!isPushSupported) {
      return;
    }

    // Normalize address to lowercase for consistency
    const normalizedAddress = address.toLowerCase();

    try {
      if (isSubscribed) {
        // Unsubscribe
        const success =
          await unsubscribeFromPushNotifications(normalizedAddress);
        if (success) {
          setIsSubscribed(false);
          setPreferences((prev) => ({ ...prev, pushEnabled: false }));
          toast.success("Push notifications disabled");
        }
      } else {
        // Subscribe
        const result = await subscribeToPushNotifications(normalizedAddress, {
          ...preferences,
          pushEnabled: true,
        });
        if (result) {
          setIsSubscribed(true);
          setPreferences((prev) => ({ ...prev, pushEnabled: true }));

          const res = result as { backendResponse?: { message?: string } };
          if (res.backendResponse?.message) {
            toast.success(res.backendResponse.message);
          } else {
            toast.success("Push notifications enabled!");
          }
        }
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to handle push notifications");
    }
  }, [
    address,
    isSubscribed,
    isPushSupported,
    preferences,
    isAccountInitializing,
  ]);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Update backend if subscribed
      if (address && isSubscribed && !isAccountInitializing) {
        try {
          const result = await updateNotificationPreferences(
            address.toLowerCase(),
            updatedPreferences,
          );

          const res = result as { message?: string };
          if (res?.message) {
            toast.success(res.message);
          }
        } catch {
          toast.error("Failed to sync preferences with server");
        }
      }
    },
    [address, isSubscribed, preferences, isAccountInitializing],
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        notificationsEnabled: preferences.inAppEnabled,
        pushEnabled: preferences.pushEnabled,
        isPushSupported,
        isSubscribed,
        preferences,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        toggleNotifications,
        clearNotification,
        clearAllNotifications,
        togglePushNotifications,
        updatePreferences,
        getTimeAgo,
        refetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
};

// Helper to map notification type to preference key
function getPrefKeyFromType(
  type: NotificationType,
): keyof NotificationPreferences | null {
  const mapping: Record<NotificationType, keyof NotificationPreferences> = {
    circle_member_joined: "circleMemberJoined",
    circle_payout: "paymentReceived",
    circle_member_payout: "circleMemberPayout",
    circle_member_contributed: "circleMemberContributed",
    circle_member_withdrew: "circleMemberWithdrew",
    circle_started: "circleStarted",
    circle_completed: "circleCompleted",
    circle_dead: "circleDead",
    contribution_due: "contributionDue",
    vote_required: "circleVoting",
    vote_executed: "circleVoting",
    member_forfeited: "memberForfeited",
    late_payment_warning: "latePaymentWarning",
    position_assigned: "positionAssigned",
    goal_deadline_2days: "goalDeadline2Days",
    goal_deadline_1day: "goalDeadline1Day",
    goal_completed: "goalCompleted",
    goal_contribution_due: "goalContributionDue",
    goal_milestone: "goalMilestone",
    goal_reminder: "goalReminder",
    circle_invite: "circleInvite",
    invite_accepted: "inviteAccepted",
    payment_received: "paymentReceived",
    payment_late: "paymentLate",
    credit_score_changed: "creditScoreChanged",
    withdrawal_fee_applied: "withdrawalFeeApplied",
    collateral_returned: "collateralReturned",
    system_maintenance: "systemMaintenance",
    system_update: "systemUpdate",
    security_alert: "securityAlert",
    circle_joined: "circleJoined",
    circle_voting: "circleVoting",
    referral_reward: "referralReward",
    circle_contribution_self: "circleContributionSelf",
  };

  return mapping[type] || null;
}

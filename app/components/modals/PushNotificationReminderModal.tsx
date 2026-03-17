"use client";

import React, { useState } from "react";
import { useNotifications } from "../NotificationsProvider";
import { Bell, X, Zap, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PushNotificationReminderModalProps {
  onClose: () => void;
}

const PushNotificationReminderModal: React.FC<PushNotificationReminderModalProps> = ({ onClose }) => {
  const { togglePushNotifications } = useNotifications();
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      await togglePushNotifications();
      // Mark as completed (user enabled notifications)
      localStorage.setItem(
        "Circlepot_push_reminder_state",
        JSON.stringify({
          lastShown: Date.now(),
          snoozeUntil: null,
          enabled: true,
        })
      );
      onClose();
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      // toast is already handled inside togglePushNotifications usually, 
      // but we can add more specific error handling here if needed
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    // Snooze for 3 days - notifications are critical, we'll remind again
    const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "Circlepot_push_reminder_state",
      JSON.stringify({
        lastShown: Date.now(),
        snoozeUntil: threeDaysFromNow,
        enabled: false,
      })
    );
    toast.info("We'll remind you in 3 days");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-[calc(100%-1rem)] sm:max-w-md max-h-[92vh] flex flex-col relative animate-in zoom-in-95 duration-300 border border-white/20 dark:border-white/10 overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={handleMaybeLater}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-light hover:text-foreground z-20"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 custom-scrollbar pr-1 -mr-1">
          {/* Icon with animation */}
          <div className="flex justify-center mb-4 sm:mb-6 mt-2">
            <div className="relative p-4 sm:p-5 rounded-3xl bg-primary/10">
              <div className="absolute inset-0 rounded-3xl animate-ping opacity-20 bg-primary" />
              <Bell size={32} className="relative z-10 text-primary sm:w-10 sm:h-10" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 text-foreground">
            Stay in the Loop!
          </h2>

          {/* Subtitle */}
          <p className="text-center mb-6 sm:mb-8 text-sm text-text-light leading-relaxed px-2">
            Enable push notifications to never miss important updates about your
            savings circles and goals.
          </p>

          {/* Benefits */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20">
              <div className="p-2 rounded-xl bg-success-bg/50 shrink-0">
                <Zap size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[13px] sm:text-sm mb-0.5 text-foreground leading-tight">
                  Instant Circle Updates
                </h4>
                <p className="text-[11px] sm:text-xs text-text-light">
                  Get notified when members join or contribute
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20">
              <div className="p-2 rounded-xl bg-error-bg/50 shrink-0">
                <Clock size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[13px] sm:text-sm mb-0.5 text-foreground leading-tight">
                  Payment Deadlines
                </h4>
                <p className="text-[11px] sm:text-xs text-text-light">
                  Never miss a deadline with timely reminders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20">
              <div className="p-2 rounded-xl bg-success-bg/50 shrink-0">
                <DollarSign size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[13px] sm:text-sm mb-0.5 text-foreground leading-tight">
                  Payout Alerts
                </h4>
                <p className="text-[11px] sm:text-xs text-text-light">
                  Celebrate instantly when you receive a payout
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom of modal */}
        <div className="flex flex-col gap-2.5 sm:gap-3 mt-4 sm:mt-0 pt-4 border-t border-border/50 sm:border-t-0">
          <button
            onClick={handleEnableNotifications}
            disabled={isEnabling}
            className="w-full py-3.5 sm:py-4 px-6 btn-primary shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 text-sm sm:text-base"
          >
            {isEnabling ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enabling...
              </span>
            ) : (
              "Enable Notifications"
            )}
          </button>

          <button
            onClick={handleMaybeLater}
            className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-semibold transition-all border border-border hover:bg-hover-bg text-foreground active:scale-[0.98] text-sm sm:text-base"
          >
            Maybe Later
          </button>

          {/* Privacy note */}
          <p className="text-[9px] sm:text-[10px] text-center mt-2 text-text-light uppercase tracking-wider font-medium">
            You can change preferences anytime in Settings
          </p>
        </div>
      </div>
    </div>

  );
};

export default PushNotificationReminderModal;

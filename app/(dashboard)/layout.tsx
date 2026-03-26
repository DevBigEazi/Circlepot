"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../hooks/useUserProfile";
import PushNotificationReminderModal from "../components/modals/PushNotificationReminderModal";
import { shouldShowPushReminder } from "../utils/pushNotificationManager";
import ProfileCreationModal from "../components/ProfileCreationModal";
import BottomNav from "../components/BottomNav";
import { useAccountAddress } from "../hooks/useAccountAddress";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, sdkHasLoaded } = useDynamicContext();
  const {
    isLoading: isProfileLoading,
    profile,
    refreshProfile,
    error: profileError,
  } = useUserProfile();
  const { isInitializing: isAccountInitializing } = useAccountAddress();
  const [isClient, setIsClient] = useState(false);
  const [showPushReminder, setShowPushReminder] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && sdkHasLoaded && !user) {
      // If not logged in, check if they've seen onboarding
      const hasCompleted = localStorage.getItem(
        "circlepot_onboarding_completed",
      );
      if (hasCompleted) {
        const currentPath = window.location.pathname;
        router.replace(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        router.replace("/");
      }
    }
  }, [isClient, sdkHasLoaded, user, router]);

  // Check if we should show push notification reminder
  useEffect(() => {
    const checkReminder = async () => {
      // Only check when user is authenticated, has profile, and app is loaded
      if (isClient && user && profile && !isProfileLoading) {
        // Add a small delay to let the user settle in before showing the prompt
        const timer = setTimeout(async () => {
          const shouldShow = await shouldShowPushReminder();
          setShowPushReminder(shouldShow);
        }, 3000); // 3 second delay

        return () => clearTimeout(timer);
      }
    };

    checkReminder();
  }, [isClient, user, profile, isProfileLoading]);

  const isDeterminingProfile = user && profile === undefined;

  // Loading timeout — prevent infinite loading screen
  const isInLoadingState =
    !isClient ||
    !sdkHasLoaded ||
    (!!user &&
      (isProfileLoading || !!isDeterminingProfile || isAccountInitializing));

  useEffect(() => {
    if (isInLoadingState) {
      // Start timeout if not already running
      if (!loadingTimeoutRef.current) {
        loadingTimeoutRef.current = setTimeout(() => {
          setLoadingTimedOut(true);
        }, 20000); // 20 seconds
      }
    } else {
      // Loading finished — clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [isInLoadingState]);

  // Handle loading states to prevent layout flashes
  if (isInLoadingState) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 animate-fade-in">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          {/* Outer Ring Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />

          {/* Logo with pulse */}
          <div className="absolute inset-4 flex items-center justify-center animate-pulse">
            <Image
              src="/assets/images/logo.png"
              alt="Circlepot Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Timeout recovery UI */}
        {loadingTimedOut && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <p className="text-sm opacity-60 text-center max-w-xs">
              This is taking longer than expected. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // If we have a user, check for profile
  if (user) {
    if (profileError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2">Systems Connection Issue</h2>
          <p className="text-sm opacity-50 mb-8 max-w-xs">
            We&apos;re having trouble reaching our database. This is usually a
            temporary network issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Retry Connection
          </button>
          <p className="mt-4 text-[9px] opacity-30 font-bold uppercase tracking-widest">
            Error: {profileError}
          </p>
        </div>
      );
    }

    if (!profile) {
      return (
        <section className="w-full h-screen overflow-hidden">
          <ProfileCreationModal onProfileCreated={refreshProfile} />
        </section>
      );
    }

    return (
      <section className="w-full flex flex-col min-h-screen pb-12">
        <div className="flex-1">{children}</div>
        <BottomNav />
        {showPushReminder && (
          <PushNotificationReminderModal
            onClose={() => setShowPushReminder(false)}
          />
        )}
      </section>
    );
  }


  // Fallback while redirecting
  return null;
}

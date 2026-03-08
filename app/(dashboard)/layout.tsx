"use client";

import React, { useEffect, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../hooks/useUserProfile";
import ProfileCreationModal from "../components/ProfileCreationModal";
import LoadingSpinner from "../components/LoadingSpinner";
import BottomNav from "../components/BottomNav";
import { useAccountAddress } from "../hooks/useAccountAddress";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, sdkHasLoaded } = useDynamicContext();
  const {
    isLoading: isProfileLoading,
    profile, // Need raw profile to distinguish null vs undefined
    refreshProfile,
  } = useUserProfile();
  const { isInitializing: isAccountInitializing } = useAccountAddress();
  const [isClient, setIsClient] = useState(false);

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

  const isDeterminingProfile = user && profile === undefined;

  // Handle loading states to prevent layout flashes
  if (
    !isClient ||
    !sdkHasLoaded ||
    (user &&
      (isProfileLoading || isDeterminingProfile || isAccountInitializing))
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Preparing your account..." />
      </div>
    );
  }

  // If we have a user, check for profile
  if (user) {
    if (!profile) {
      return (
        <section className="w-full h-screen overflow-hidden">
          <ProfileCreationModal onProfileCreated={refreshProfile} />
        </section>
      );
    }

    return (
      <section className="w-full flex flex-col min-h-screen pb-20">
        <div className="flex-1">{children}</div>
        <BottomNav />
      </section>
    );
  }

  // Fallback while redirecting
  return null;
}

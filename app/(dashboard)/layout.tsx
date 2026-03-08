"use client";

import React, { useEffect, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../hooks/useUserProfile";
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
      <section className="w-full flex flex-col min-h-screen pb-12">
        <div className="flex-1">{children}</div>
        <BottomNav />
      </section>
    );
  }

  // Fallback while redirecting
  return null;
}

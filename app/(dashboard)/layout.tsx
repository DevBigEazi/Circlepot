"use client";

import React, { useEffect, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, sdkHasLoaded } = useDynamicContext();
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
        router.replace("/auth");
      } else {
        router.replace("/");
      }
    }
  }, [isClient, sdkHasLoaded, user, router]);

  // Handle loading states to prevent layout flashes
  if (!isClient || !sdkHasLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If we have a user, render the dashboard
  if (user) {
    return <section className="w-full flex flex-col">{children}</section>;
  }

  // Fallback while redirecting
  return null;
}

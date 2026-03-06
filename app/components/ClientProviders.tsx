"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { CurrencyProvider } from "./CurrencyProvider";
import { NotificationsProvider } from "./NotificationsProvider";
import { UserProfileProvider } from "./UserProfileProvider";
import { SavingsProvider } from "./SavingsProvider";
import { Toaster } from "sonner";
import ReferralCapturer from "./ReferralCapturer";
import { Suspense } from "react";

// Initialize QueryClient once per client lifecycle
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <NotificationsProvider>
            <UserProfileProvider>
              <SavingsProvider>
                <Suspense fallback={null}>
                  <ReferralCapturer />
                </Suspense>
                {children}
                <Toaster position="top-center" />
              </SavingsProvider>
            </UserProfileProvider>
          </NotificationsProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

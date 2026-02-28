import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* 
        This layout isolates the onboarding flow from the main app dashboard.
        We don't include sidebars or main app navigation here.
      */}
      {children}
    </main>
  );
}

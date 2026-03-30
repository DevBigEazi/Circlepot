import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create your account and start saving with Circlepot. Join community savings circles with friends or set personal savings goals — safe, automated, and simple.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Circlepot",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Community savings app that lets you pool funds with friends, set savings goals, and save in stable digital dollars — automated and secure.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Automated savings circles",
    "Personal savings goals",
    "Savings in stable digital dollars",
    "Secure and transparent",
    "Community-driven payouts",
  ],
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </main>
  );
}


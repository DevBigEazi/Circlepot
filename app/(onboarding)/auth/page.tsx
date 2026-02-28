"use client";

import React, { useEffect, useState } from "react";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const router = useRouter();
  const { user } = useDynamicContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Decorative Circles in Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md space-y-12 z-10 animate-fade-in">
        {/* Branding Area */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-24 h-24 shadow-xl rounded-2xl overflow-hidden p-4 bg-surface border border-border">
            <Image
              src="/assets/images/logo.png"
              alt="Circlepot Logo"
              fill
              className="object-contain p-2"
              priority
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-schibsted-grotesk">
              Secure Access
            </h1>
            <p className="text-text-light text-base max-w-[280px] mx-auto">
              Choose your preferred method to connect and manage your savings.
            </p>
          </div>
        </div>

        {/* Dynamic Widget Container */}
        <div className="glass rounded-3xl p-8 card-shadow flex flex-col items-center justify-center space-y-8 min-h-[220px]">
          <div className="scale-110">
            <DynamicWidget />
          </div>

          <div className="w-full space-y-4">
            <div className="h-px bg-linear-to-r from-transparent via-border to-transparent w-full" />
            <p className="text-[11px] text-text-light text-center leading-relaxed opacity-70">
              Connecting your wallet establishes a secure, decentralized
              identity. No password needed, ever.
            </p>
          </div>
        </div>

        {/* Support Links / Footer */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium text-text-light hover:text-primary transition-colors py-2 px-4"
          >
            Go back to onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

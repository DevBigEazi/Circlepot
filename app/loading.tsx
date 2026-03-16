"use client";

import React from "react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse scale-150" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-surface rounded-3xl border-4 border-border shadow-2xl flex items-center justify-center overflow-hidden animate-bounce-soft">
            <Image
              src="/assets/images/logo.png"
              alt="Circlepot Logo"
              width={80}
              height={80}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading Text & Spinner */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-xl font-black tracking-widest uppercase opacity-40 animate-pulse">
              Circlepot
            </span>
          </div>
          <p className="text-xs font-bold text-text-light/40 uppercase tracking-[0.2em] animate-fade-in slide-in-from-bottom-2 duration-700">
            Securely initializing...
          </p>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
}

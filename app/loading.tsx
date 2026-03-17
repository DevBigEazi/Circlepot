"use client";

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
      </div>
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
}

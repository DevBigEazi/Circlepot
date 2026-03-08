"use client";

import React from "react";
import Image from "next/image";
import { Mail, CheckCircle2 } from "lucide-react";

interface AuthMethodSelectProps {
  onSelectEmail: () => void;
  onGoogleLogin: () => void;
  isLoading?: boolean;
  isOnline?: boolean;
}

export const AuthMethodSelect: React.FC<AuthMethodSelectProps> = ({
  onSelectEmail,
  onGoogleLogin,
  isLoading = false,
  isOnline = true,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 animate-fade-in [animation-delay:200ms]">
      <button
        onClick={onGoogleLogin}
        disabled={isLoading || !isOnline}
        className="flex justify-center items-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 font-bold gap-2 sm:gap-3 transition-all border-2 border-border hover:border-primary hover:shadow-lg disabled:opacity-50 cursor-wait bg-white group w-full relative text-sm sm:text-base"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-foreground/70">Connecting...</span>
          </div>
        ) : (
          <>
            <Image
              src="/assets/images/google.svg"
              alt="google logo"
              width={24}
              height={24}
            />
            <span className="text-foreground">Continue with Google</span>
          </>
        )}
      </button>

      {!isOnline && (
        <p className="text-[11px] text-red-500 font-bold text-center -mt-2">
          Offline: Please connect to internet
        </p>
      )}

      <div className="flex justify-center items-center gap-2 sm:gap-4 my-1 sm:my-2 px-2 sm:px-10">
        <div className="flex-1 h-0.5 bg-border rounded-full" />
        <p className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-text-light/60">
          Or
        </p>
        <div className="flex-1 h-0.5 bg-border rounded-full" />
      </div>

      <button
        onClick={onSelectEmail}
        disabled={isLoading || !isOnline}
        className="flex justify-center items-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 font-bold gap-2 sm:gap-3 transition-all border-2 border-primary/20 bg-success-bg hover:bg-success-bg/80 hover:border-primary text-primary hover:shadow-lg disabled:opacity-50 cursor-pointer w-full group text-sm sm:text-base"
      >
        <Mail
          size={24}
          className="group-hover:scale-110 transition-transform"
        />
        <span>Continue with Email</span>
      </button>

      {/* 
      <button
        onClick={onSelectPhone}
        disabled={isLoading || !isOnline}
        className="flex justify-center items-center rounded-xl sm:rounded-2xl py-3 sm:py-3.5 font-bold gap-2 sm:gap-3 transition-all border-2 border-border/80 bg-accent-bg hover:bg-accent-bg/80 hover:border-primary text-foreground hover:shadow-lg disabled:opacity-50 cursor-pointer w-full group text-sm sm:text-base"
      >
        <Phone
          size={24}
          className="group-hover:scale-110 transition-transform"
        />
        <span>Continue with Phone</span>
      </button>
      */}
      {/* Benefits List */}
      <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-2 sm:gap-3">
        {[
          "No complex wallet setup",
          "Recover with your email/phone",
          "Decentralized and non-custodial",
          "Option to export private keys",
        ].map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-text-light font-medium"
          >
            <CheckCircle2 className="text-primary shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

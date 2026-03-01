"use client";

import React from "react";
import Image from "next/image";
import { Mail, Phone, Zap, CheckCircle2 } from "lucide-react";

interface AuthMethodSelectProps {
  onSelectEmail: () => void;
  onSelectPhone: () => void;
  onGoogleLogin: () => void;
  isLoading?: boolean;
}

export const AuthMethodSelect: React.FC<AuthMethodSelectProps> = ({
  onSelectEmail,
  onSelectPhone,
  onGoogleLogin,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in [animation-delay:200ms]">
      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        className="flex justify-center items-center rounded-2xl py-3.5 font-bold gap-3 transition-all border-2 border-border hover:border-primary hover:shadow-lg disabled:opacity-50 cursor-pointer bg-white group w-full"
      >
        <Image
          src="/assets/images/google.svg"
          alt="google logo"
          width={24}
          height={24}
        />
        <span className="text-foreground">Continue with Google</span>
      </button>

      <div className="flex justify-center items-center gap-4 my-2 px-10">
        <div className="flex-1 h-0.5 bg-border rounded-full" />
        <p className="text-xs uppercase tracking-widest font-bold text-text-light/60">
          Or
        </p>
        <div className="flex-1 h-0.5 bg-border rounded-full" />
      </div>

      <button
        onClick={onSelectEmail}
        disabled={isLoading}
        className="flex justify-center items-center rounded-2xl py-3.5 font-bold gap-3 transition-all border-2 border-primary/20 bg-success-bg hover:bg-success-bg/80 hover:border-primary text-primary hover:shadow-lg disabled:opacity-50 cursor-pointer w-full group"
      >
        <Mail
          size={24}
          className="group-hover:scale-110 transition-transform"
        />
        <span>Continue with Email</span>
      </button>

      <button
        onClick={onSelectPhone}
        disabled={isLoading}
        className="flex justify-center items-center rounded-2xl py-3.5 font-bold gap-3 transition-all border-2 border-border/80 bg-accent-bg hover:bg-accent-bg/80 hover:border-primary text-foreground hover:shadow-lg disabled:opacity-50 cursor-pointer w-full group"
      >
        <Phone
          size={24}
          className="group-hover:scale-110 transition-transform"
        />
        <span>Continue with Phone</span>
      </button>

      {/* Info Card */}
      <div className="mt-8 glass rounded-2xl p-5 border border-primary/20 bg-primary/5 transition-all hover:bg-primary/10">
        <div className="flex items-center gap-3 mb-3">
          <Zap size={18} className="text-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">
            Secure & Simple
          </span>
        </div>
        <p className="text-[13px] text-text-light leading-relaxed">
          Secure dollar wallet • Full self-custody • Easy account recovery
        </p>
      </div>

      {/* Benefits List */}
      <div className="mt-6 grid grid-cols-1 gap-3">
        {[
          "No complex wallet setup",
          "Recover with your email/phone",
          "Decentralized and non-custodial",
        ].map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-2.5 text-xs text-text-light font-medium"
          >
            <CheckCircle2 size={16} className="text-primary shrink-0" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

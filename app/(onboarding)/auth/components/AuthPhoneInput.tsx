"use client";

import React, { useState } from "react";
import { Phone, ArrowLeft, Send } from "lucide-react";

interface AuthPhoneInputProps {
  onNext: (phone: string) => void;
  onBack: () => void;
  initialValue?: string;
  isLoading?: boolean;
}

export const AuthPhoneInput: React.FC<AuthPhoneInputProps> = ({
  onNext,
  onBack,
  initialValue = "",
  isLoading = false,
}) => {
  const [phone, setPhone] = useState(initialValue);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2.5 text-sm font-bold text-text-light hover:text-foreground transition-all group w-fit cursor-pointer"
        aria-label="Back"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>Back</span>
      </button>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-schibsted-grotesk">
            Enter Phone Number
          </h2>
          <p className="text-sm text-text-light mt-2 max-w-[200px] mx-auto leading-relaxed">
            Enter your mobile number with country code (e.g., +1...)
          </p>
        </div>

        <div className="space-y-2.5">
          <label
            htmlFor="phone-input"
            className="block text-sm font-bold text-foreground/80 ml-1"
          >
            Mobile Number
          </label>
          <div className="relative group">
            <Phone
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors"
            />
            <input
              id="phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full pl-12 pr-4 py-4 border-2 border-border/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-white text-foreground font-medium disabled:opacity-50"
              disabled={isLoading}
              autoFocus
            />
          </div>
        </div>

        <button
          onClick={() => onNext(phone)}
          disabled={isLoading || phone.length < 8}
          className="flex justify-center items-center rounded-2xl py-4 font-bold gap-3 transition-all bg-primary hover:bg-primary/95 text-white hover:shadow-xl disabled:opacity-50 cursor-pointer w-full group relative overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending Code...</span>
            </div>
          ) : (
            <>
              <span>Send Verification SMS</span>
              <Send
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </>
          )}
        </button>

        {/* Informative nudge */}
        <div className="bg-success-bg/10 rounded-2xl p-5 border border-success-border/20 transition-all hover:bg-success-bg/20">
          <p className="text-[13px] text-text-light leading-relaxed">
            Fast and secure. We&apos;ll send a 6-digit code via SMS to confirm
            your identity. Carrier rates may apply.
          </p>
        </div>
      </div>
    </div>
  );
};

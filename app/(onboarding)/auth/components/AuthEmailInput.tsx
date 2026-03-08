"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft, Send, AlertCircle } from "lucide-react";
import { isValidEmail, getDomainSuggestion } from "@/app/utils/auth-utils";

interface AuthEmailInputProps {
  onNext: (email: string) => void;
  onBack: () => void;
  initialValue?: string;
  isLoading?: boolean;
  isOnline?: boolean;
}

export const AuthEmailInput: React.FC<AuthEmailInputProps> = ({
  onNext,
  onBack,
  initialValue = "",
  isLoading = false,
  isOnline = true,
}) => {
  const [email, setEmail] = useState(initialValue);
  const suggestion = getDomainSuggestion(email);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
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

      <div className="space-y-5 sm:space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-schibsted-grotesk">
            Enter Your Email
          </h2>
          <p className="text-xs sm:text-sm text-text-light mt-1.5 sm:mt-2 max-w-[200px] mx-auto leading-relaxed">
            We&apos;ll send you a verification code to sign in
          </p>
        </div>

        <div className="space-y-2 sm:space-y-2.5">
          <label
            htmlFor="email-input"
            className="block text-xs sm:text-sm font-bold text-foreground/80 ml-1"
          >
            Email Address
          </label>
          <div className="relative group">
            <Mail
              size={20}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-text-light group-focus-within:text-primary transition-colors"
            />
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-border/80 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-white text-foreground font-medium disabled:opacity-50"
              disabled={isLoading || !isOnline}
              autoFocus
            />
          </div>
          {suggestion && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-[12px] font-medium leading-tight">
                Did you mean{" "}
                <span
                  className="font-bold underline cursor-pointer"
                  onClick={() =>
                    setEmail(email.split("@")[0] + "@" + suggestion)
                  }
                >
                  {suggestion}
                </span>
                ?
              </p>
            </div>
          )}
          {!isOnline && (
            <p className="text-[11px] text-red-500 font-bold ml-1">
              Connect to internet to send code
            </p>
          )}
        </div>

        <button
          onClick={() => onNext(email)}
          disabled={isLoading || !isValidEmail(email) || !isOnline}
          className="flex justify-center items-center rounded-xl sm:rounded-2xl py-3 sm:py-4 text-sm sm:text-base font-bold gap-2 sm:gap-3 transition-all bg-primary hover:bg-primary/95 text-white hover:shadow-xl disabled:opacity-50 cursor-pointer w-full group relative overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending Code...</span>
            </div>
          ) : (
            <>
              <span>Send Verification Code</span>
              <Send
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </>
          )}
        </button>

        {/* Informative nudge */}
        <div className="bg-success-bg/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-success-border/20 transition-all hover:bg-success-bg/20">
          <p className="text-[11px] sm:text-[13px] text-text-light leading-relaxed">
            What happens next? We&apos;ll create your secure digital wallet
            automatically. You&apos;ll have full control of your funds with easy
            recovery options.
          </p>
        </div>
      </div>
    </div>
  );
};

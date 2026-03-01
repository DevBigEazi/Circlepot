"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";

interface AuthOTPVerifyProps {
  onVerify: (code: string) => void;
  onBack: () => void;
  onResend: () => void;
  targetAddress: string;
  isLoading?: boolean;
}

export const AuthOTPVerify: React.FC<AuthOTPVerifyProps> = ({
  onVerify,
  onBack,
  onResend,
  targetAddress,
  isLoading = false,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every((digit) => digit !== "")) {
      onVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").substring(0, 6).split("");
    const newOtp = [...otp];
    pasteData.forEach((char, i) => {
      if (!isNaN(Number(char))) {
        newOtp[i] = char;
      }
    });
    setOtp(newOtp);
    if (pasteData.length > 0) {
      const lastIndex = Math.min(5, pasteData.length - 1);
      inputRefs.current[lastIndex]?.focus();
    }
    if (newOtp.every((digit) => digit !== "")) {
      onVerify(newOtp.join(""));
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(60);
      onResend();
    }
  };

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
            Verify Your Identity
          </h2>
          <p className="text-sm text-text-light mt-2 max-w-[200px] mx-auto leading-relaxed">
            Enter the 6-digit code sent to{" "}
            <span className="font-bold text-foreground break-all">
              {targetAddress}
            </span>
          </p>
        </div>

        <div className="flex justify-between items-center gap-2.5">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-border/80 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-white text-foreground disabled:opacity-50 shadow-sm"
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <button
          onClick={() => onVerify(otp.join(""))}
          disabled={isLoading || otp.some((digit) => !digit)}
          className="flex justify-center items-center rounded-2xl py-4 font-bold gap-3 transition-all bg-primary hover:bg-primary/95 text-white hover:shadow-xl disabled:opacity-50 cursor-pointer w-full group overflow-hidden relative"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          ) : (
            <>
              <span>Verify Code</span>
              <CheckCircle2
                size={18}
                className="transition-transform group-hover:scale-110"
              />
            </>
          )}
        </button>

        <div className="text-center flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={resendTimer > 0 || isLoading}
            className="text-sm font-bold text-primary hover:underline disabled:text-text-light disabled:no-underline transition-all cursor-pointer"
          >
            {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Code"}
          </button>
        </div>

        {/* Informative nudge */}
        <div className="bg-accent-bg/10 rounded-2xl p-5 border border-accent-border/20 transition-all hover:bg-accent-bg/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-primary" />
            <span className="text-xs font-bold text-foreground">
              Almost there!
            </span>
          </div>
          <p className="text-[12px] text-text-light leading-relaxed">
            Your digital wallet is being prepared in the background. Once
            verified, you&apos;ll be redirected instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

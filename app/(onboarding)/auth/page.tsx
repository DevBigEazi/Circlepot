"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useDynamicContext,
  useConnectWithOtp,
  useSocialAccounts,
} from "@dynamic-labs/sdk-react-core";
import { ProviderEnum } from "@dynamic-labs/types";
import { toast } from "sonner";
import { AuthHeader } from "./components/AuthHeader";
import { AuthMethodSelect } from "./components/AuthMethodSelect";
import { AuthEmailInput } from "./components/AuthEmailInput";
import { AuthPhoneInput } from "./components/AuthPhoneInput";
import { AuthOTPVerify } from "./components/AuthOTPVerify";
import {
  isValidEmail,
  isValidPhone,
  parsePhoneNumber,
  mapDynamicError,
} from "@/app/utils/auth-utils";

type AuthStep = "select" | "email_input" | "phone_input" | "otp";

function AuthPageContent() {
  const router = useRouter();
  const { user } = useDynamicContext();
  const searchParams = useSearchParams();
  const redirectPath = searchParams?.get("redirect") || "/dashboard";
  const isLoggedIn = !!user;

  const [step, setStep] = useState<AuthStep>("select");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [activeAddress, setActiveAddress] = useState(""); // Current email or phone being verified

  // Dynamic Login Hooks
  const { connectWithEmail, connectWithSms, verifyOneTimePassword } =
    useConnectWithOtp();
  const {
    signInWithSocialAccount,
    isProcessing: isSocialProcessing,
    error: socialError,
  } = useSocialAccounts();

  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      setIsLoading(true); // Keep spinner on during redirect
      router.replace(redirectPath);
    }
  }, [isLoggedIn, user, router, redirectPath]);

  // Handle errors from social accounts hook to prevent "stuck" states
  useEffect(() => {
    if (socialError) {
      console.error("Dynamic Social Error:", socialError);

      const errorMessage = mapDynamicError(socialError);

      if (errorMessage) {
        toast.error(errorMessage);
      }
      setIsLoading(false);
    }
  }, [socialError]);

  // --- Handlers ---

  const handleGoogleLogin = async () => {
    if (!isOnline) {
      toast.error(
        "You are offline. Please connect to the internet to sign in.",
      );
      return;
    }
    try {
      setIsLoading(true);
      await signInWithSocialAccount(ProviderEnum.Google);
    } catch (error) {
      console.error("Google login error:", error);
      const msg = mapDynamicError(error);
      if (msg) toast.error(msg);
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (emailInput: string) => {
    if (!isOnline) {
      toast.error("Offline. Cannot send verification code.");
      return;
    }

    if (!isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      setEmail(emailInput);
      setActiveAddress(emailInput);

      await connectWithEmail(emailInput);

      setStep("otp");
      toast.success("Verification code sent to your email!");
    } catch (error) {
      console.error("Email OTP error:", error);
      const msg = mapDynamicError(error);
      if (msg) toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (phoneInput: string) => {
    if (!isOnline) {
      toast.error("Offline. Cannot send verification SMS.");
      return;
    }

    if (!isValidPhone(phoneInput)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    try {
      setIsLoading(true);
      setPhone(phoneInput);
      setActiveAddress(phoneInput);

      const { dialCode, phone, iso2 } = parsePhoneNumber(phoneInput);

      await connectWithSms({
        phone,
        dialCode,
        iso2,
      });

      setStep("otp");
      toast.success("Verification code sent to your phone!");
    } catch (error) {
      console.error("Phone OTP error:", error);
      const msg = mapDynamicError(error);
      if (msg) toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    if (!isOnline) {
      toast.error("Offline. Cannot verify code.");
      return;
    }

    try {
      setIsLoading(true);
      await verifyOneTimePassword(otp);
      toast.success("Successfully verified!");
      // We keep isLoading true to show the spinner until redirected
    } catch (error) {
      console.error("OTP verification error:", error);
      const msg = mapDynamicError(error);
      if (msg) toast.error(msg);
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (email) {
      await handleEmailSubmit(email);
    } else if (phone) {
      await handlePhoneSubmit(phone);
    }
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep(email ? "email_input" : "phone_input");
    } else {
      setStep("select");
      setEmail("");
      setPhone("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-hidden">
      <div className="w-full max-w-md z-10 transition-all duration-300">
        <div className="p-2 sm:p-6">
          {/* 1. Header Area */}
          <AuthHeader
            title={step === "select" ? "Sign In" : ""}
            description={
              step === "select"
                ? "Join thousands saving together globally, and spending locally."
                : ""
            }
          />

          {/* 2. Content Area based on current step */}
          <div className="min-h-[300px] flex flex-col">
            {step === "select" && (
              <AuthMethodSelect
                onSelectEmail={() => setStep("email_input")}
                onGoogleLogin={handleGoogleLogin}
                isLoading={isLoading || isSocialProcessing}
                isOnline={isOnline}
              />
            )}

            {step === "email_input" && (
              <AuthEmailInput
                onNext={handleEmailSubmit}
                onBack={handleBack}
                initialValue={email}
                isLoading={isLoading}
                isOnline={isOnline}
              />
            )}

            {step === "phone_input" && (
              <AuthPhoneInput
                onNext={handlePhoneSubmit}
                onBack={handleBack}
                initialValue={phone}
                isLoading={isLoading}
                isOnline={isOnline}
              />
            )}

            {step === "otp" && (
              <AuthOTPVerify
                targetAddress={activeAddress}
                onVerify={handleVerifyOTP}
                onBack={handleBack}
                onResend={handleResendOTP}
                isLoading={isLoading}
                isOnline={isOnline}
              />
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-text-light/50 text-[10px] sm:text-[11px] mt-6 sm:mt-8 font-medium px-2">
          By continuing, you agree to Circlepot&apos;s Terms of Service and
          Privacy Policy.
          <br />
          Securely powered by Dynamic XYZ & Avalanche.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
            Secure Auth Loading...
          </p>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

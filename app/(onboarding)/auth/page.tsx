"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

type AuthStep = "select" | "email_input" | "phone_input" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const { user } = useDynamicContext();
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

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, user, router]);

  // Handle errors from social accounts hook to prevent "stuck" states
  useEffect(() => {
    if (socialError) {
      console.error("Dynamic Social Error:", socialError);
      // Mapping common configuration errors to friendly messages
      const errorMessage =
        socialError.message?.includes("not enabled") ||
        socialError.message?.includes("configuration")
          ? "Google login is not yet configured in the dashboard. Please use Email login for now."
          : socialError.message || "Social login failed. Please try again.";

      toast.error(errorMessage);
      setIsLoading(false);
    }
  }, [socialError]);

  // --- Handlers ---

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithSocialAccount(ProviderEnum.Google);
      // Page will redirect via useEffect when login completes
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to login with Google. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (emailInput: string) => {
    try {
      setIsLoading(true);
      setEmail(emailInput);
      setActiveAddress(emailInput);

      await connectWithEmail(emailInput);

      setStep("otp");
      toast.success("Verification code sent to your email!");
    } catch (error) {
      console.error("Email OTP error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send code. Check your email address.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (phoneInput: string) => {
    try {
      setIsLoading(true);
      setPhone(phoneInput);
      setActiveAddress(phoneInput);

      // Simple parsing as initial step — real apps should use a proper lib or handle inputs separately
      // but following the provided example structure
      await connectWithSms({
        phone: phoneInput.replace(/^\+?[1-9]\s?/, ""),
        dialCode: phoneInput.match(/^\+?([1-9]\d{0,3})/)?.[1] || "1",
        iso2: "US", // Default for now
      });

      setStep("otp");
      toast.success("Verification code sent to your phone!");
    } catch (error) {
      console.error("Phone OTP error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send SMS. Make sure to include country code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    try {
      setIsLoading(true);
      await verifyOneTimePassword(otp);
      toast.success("Successfully verified!");
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid or expired code. Please try again.",
      );
    } finally {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md z-10 transition-all duration-300">
        <div className="p-4 sm:p-6">
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
                onSelectPhone={() => setStep("phone_input")}
                onGoogleLogin={handleGoogleLogin}
                isLoading={isLoading || isSocialProcessing}
              />
            )}

            {step === "email_input" && (
              <AuthEmailInput
                onNext={handleEmailSubmit}
                onBack={handleBack}
                initialValue={email}
                isLoading={isLoading}
              />
            )}

            {step === "phone_input" && (
              <AuthPhoneInput
                onNext={handlePhoneSubmit}
                onBack={handleBack}
                initialValue={phone}
                isLoading={isLoading}
              />
            )}

            {step === "otp" && (
              <AuthOTPVerify
                targetAddress={activeAddress}
                onVerify={handleVerifyOTP}
                onBack={handleBack}
                onResend={handleResendOTP}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-text-light/50 text-[11px] mt-8 font-medium">
          By continuing, you agree to Circlepot&apos;s Terms of Service and
          Privacy Policy.
          <br />
          Securely powered by Dynamic XYZ.
        </p>
      </div>
    </div>
  );
}

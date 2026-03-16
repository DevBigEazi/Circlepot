"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Mail, Phone, Loader } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import {
  useUserUpdateRequest,
  useRefreshUser,
  useSocialAccounts,
} from "@dynamic-labs/sdk-react-core";
import { toast } from "sonner";
import { ProviderEnum } from "@dynamic-labs/sdk-api-core";

interface UpdateContactModalProps {
  type: "email" | "phone";
  currentValue?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const UpdateContactModal: React.FC<UpdateContactModalProps> = ({
  type,
  currentValue,
  onClose,
  onSuccess,
}) => {
  const colors = useThemeColors();
  const { updateUser, unlinkUserEmail } = useUserUpdateRequest();
  const { unlinkSocialAccount } = useSocialAccounts();
  const refreshUser = useRefreshUser();

  const [step, setStep] = useState<"input" | "verify">("input");
  const [contactValue, setContactValue] = useState(currentValue || "");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  const [verifyHandler, setVerifyHandler] = useState<
    ((otp: string) => Promise<unknown>) | null
  >(null);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmail = type === "email";
  const title = currentValue
    ? `Update ${isEmail ? "Email" : "Phone Number"}`
    : `Link ${isEmail ? "Email" : "Phone Number"}`;

  const isInputValid = isEmail
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)
    : contactValue.length >= 8;

  const handleSendCode = async () => {
    if (!contactValue.trim()) return;

    setIsLoading(true);
    try {
      const result = await updateUser({
        [isEmail ? "email" : "phoneNumber"]: contactValue.trim(),
      });

      if (
        result.isEmailVerificationRequired ||
        result.isSmsVerificationRequired
      ) {
        if (result.verifyOtp) {
          setVerifyHandler(() => result.verifyOtp!);
          setStep("verify");
          toast.info(
            `Verification code sent to your ${isEmail ? "email" : "phone"}.`,
          );
        } else {
          throw new Error(
            "Verification required but no verification handler provided",
          );
        }
      } else {
        // No verification required, update complete
        toast.success(
          `${isEmail ? "Email" : "Phone number"} updated successfully!`,
        );
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send verification code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, "").slice(-1);
      const newDigits = [...codeDigits];
      newDigits[index] = digit;
      setCodeDigits(newDigits);
      setVerificationCode(newDigits.join(""));

      // Auto-focus next input
      if (digit && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    },
    [codeDigits],
  );

  const handleCodeKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
      }
    },
    [codeDigits],
  );

  const handleCodePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      const newDigits = Array(6).fill("");
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setCodeDigits(newDigits);
      setVerificationCode(newDigits.join(""));

      // Focus the next empty input or the last one
      const nextEmpty = newDigits.findIndex((d) => !d);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      codeInputRefs.current[focusIndex]?.focus();
    },
    [],
  );

  const handleVerify = async () => {
    if (verificationCode.length !== 6 || !verifyHandler) return;

    setIsLoading(true);
    try {
      await verifyHandler(verificationCode);

      // Step 2a: intermediate refresh to ensure the SDK sees the new email
      // This is often required before Dynamic allows unlinking the last remaining identity
      const updatedUser = await refreshUser();

      // 2. IDENTITY REPLACEMENT: Cleanup Phase
      if (updatedUser && currentValue) {
        const lowerCurrent = currentValue.toLowerCase();

        // Broaden the search to catch ALL credentials related to the old email
        const credentialsToUnlink = updatedUser.verifiedCredentials.filter(
          (cred) => {
            const pubId = cred.publicIdentifier?.toLowerCase();
            const email = cred.email?.toLowerCase();
            const phone = cred.phoneNumber?.toLowerCase();
            const oauthEmails =
              cred.oauthEmails?.map((e) => e.toLowerCase()) || [];

            return (
              pubId === lowerCurrent ||
              email === lowerCurrent ||
              phone === lowerCurrent ||
              oauthEmails.includes(lowerCurrent)
            );
          },
        );

        for (const cred of credentialsToUnlink) {
          try {
            // If it's a social account (Google, etc.), use unlinkSocialAccount
            if (cred.oauthProvider) {
              await unlinkSocialAccount(
                cred.oauthProvider as unknown as ProviderEnum,
                cred.id,
              );
            }
            // If it's the primary email/phone, use unlinkUserEmail
            else {
              await unlinkUserEmail({ verifiedCredentialId: cred.id });
            }
          } catch (unlinkErr) {
            console.error(
              `[Identity Cleanup] FAILED to unlink credential ${cred.id}:`,
              unlinkErr,
            );
            // We catch but don't rethrow to avoid blocking the whole process if one unlink fails
          }
        }
      }

      // 3. Refresh the user twice to ensure JWT rotation and internal state sync
      // Sometimes one refresh is too fast for the backend to propagate
      await refreshUser();

      toast.success(
        `${isEmail ? "Email" : "Phone number"} verified and updated!`,
      );

      // We trigger a slight delay before onSuccess to allow token to reflect locally
      setTimeout(async () => {
        await refreshUser(); // Second refresh to be sure
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCodeDigits(Array(6).fill(""));
    setVerificationCode("");
    await handleSendCode();
    codeInputRefs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              {isEmail ? (
                <Mail className="text-white" size={22} />
              ) : (
                <Phone className="text-white" size={22} />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition hover:bg-black/5"
              style={{ color: colors.text }}
            >
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>
            {title}
          </h2>
          <p className="text-sm opacity-60">
            {step === "input"
              ? `Enter your ${isEmail ? "email address" : "phone number with country code"}`
              : `Enter the 6-digit code sent to`}
            {step === "verify" && (
              <span className="font-medium" style={{ color: colors.primary }}>
                {" "}
                {contactValue}
              </span>
            )}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "input" ? (
            <div className="space-y-4">
              {/* Current value display */}
              {currentValue && (
                <div
                  className="rounded-2xl p-3 border text-xs"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  <span className="opacity-50">Current: </span>
                  <span className="font-medium">{currentValue}</span>
                </div>
              )}

              {/* Input field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  {isEmail ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type={isEmail ? "email" : "tel"}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={
                    isEmail ? "you@example.com" : "+234 812 345 6789"
                  }
                  disabled={isLoading}
                  autoFocus
                  className="w-full px-5 py-3.5 rounded-2xl border transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && isInputValid) handleSendCode();
                  }}
                />
                {!isEmail && (
                  <p className="text-xs opacity-50">
                    Include country code (e.g., +1 for US, +234 for Nigeria)
                  </p>
                )}
              </div>

              {/* Send button */}
              <button
                onClick={handleSendCode}
                disabled={isLoading || !isInputValid}
                className="w-full py-3.5 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* OTP Code Inputs */}
              <div className="flex gap-2.5 justify-center">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeInputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={codeDigits[i]}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={i === 0 ? handleCodePaste : undefined}
                    autoFocus={i === 0}
                    disabled={isLoading}
                    className="w-12 h-14 text-center text-xl font-bold border-2 rounded-2xl transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                    style={{
                      borderColor: codeDigits[i]
                        ? colors.primary
                        : colors.border,
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full py-3.5 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Update"
                )}
              </button>

              {/* Resend */}
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="w-full text-center text-xs font-medium opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
              >
                Didn&apos;t receive the code? Resend
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: colors.border }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl font-medium transition-colors hover:bg-black/5 text-sm"
            style={{ color: colors.text }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateContactModal;

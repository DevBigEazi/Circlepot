"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { User, Camera, Check, AlertCircle, UserRound } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserProfile } from "../hooks/useUserProfile";
import {
  useDynamicContext,
  useUserUpdateRequest,
  useRefreshUser,
} from "@dynamic-labs/sdk-react-core";
import { useAccountAddress } from "../hooks/useAccountAddress";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { formatAddress } from "../utils/helpers";
import Image from "next/image";

interface ProfileCreationModalProps {
  onProfileCreated?: () => void;
}

const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({
  onProfileCreated,
}) => {
  const colors = useThemeColors();
  const { user } = useDynamicContext();
  const { address: accountAddress, isInitializing: isAccountInitializing } =
    useAccountAddress();
  const { updateUser } = useUserUpdateRequest();
  const refreshUser = useRefreshUser();
  const { createProfile, checkUsernameAvailability } = useUserProfile();

  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = useCallback(
    (value: string) => {
      // Remove any whitespace and convert to lowercase
      const cleanedValue = value.replace(/\s/g, "").toLowerCase();
      setUserName(cleanedValue);

      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }

      if (cleanedValue.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      usernameCheckTimeout.current = setTimeout(async () => {
        setIsCheckingUsername(true);
        try {
          const available = await checkUsernameAvailability(cleanedValue);
          setUsernameAvailable(available);
        } catch {
          setUsernameAvailable(null);
        } finally {
          setIsCheckingUsername(false);
        }
      }, 800);
    },
    [checkUsernameAvailability],
  );

  useEffect(() => {
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);

    if (!userName.trim()) {
      toast.error("Username is required");
      setIsSubmitting(false);
      return;
    }

    if (usernameAvailable === false) {
      toast.error("Username is not available");
      setIsSubmitting(false);
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name are required");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Sync to Dynamic.xyz first (so their dashboard is correct)
      // We use a nested try-catch so that Dynamic sync issues (like "disabled fields")
      // don't block the entire profile creation process.
      try {
        // Attempt to sync username and names.
        await updateUser({
          username: userName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      } catch (dynamicError: unknown) {
        if (
          dynamicError &&
          typeof dynamicError === "object" &&
          "status" in dynamicError
        ) {
          const status = (dynamicError as { status: number }).status;
          console.error(
            "Dynamic sync failed (likely disabled fields):",
            dynamicError,
          );
          // Fallback to names only if username update is rejected (422)
          if (status === 422) {
            try {
              await updateUser({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
              });
            } catch (nameError) {
              console.error("Names-only sync also failed:", nameError);
            }
          }
        }
      }

      // Force a refresh of the user object to update Dashboard display immediately
      await refreshUser();

      // 2. Create profile via our API
      const storedRef = localStorage.getItem("cp_referral_code");
      await createProfile({
        username: userName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profilePhoto: previewImage, // Cloudinary handles base64 on server
        walletAddress: accountAddress || null,
        referralCode: storedRef || undefined,
      });

      // Clear referral on success
      if (storedRef) {
        localStorage.removeItem("cp_referral_code");
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(`Welcome to Circlepot, ${firstName}!`, {
        description: "Your profile is ready.",
      });

      if (onProfileCreated) {
        onProfileCreated();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isFormValid =
    userName.trim().length >= 3 &&
    usernameAvailable === true &&
    !isCheckingUsername &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  const isProcessing = isSubmitting || isAccountInitializing;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: "1px",
        }}
      >
        {/* Header */}
        <div
          className="p-8 text-center border-b"
          style={{ borderColor: colors.border }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner"
            style={{ backgroundColor: colors.accentBg }}
          >
            <User style={{ color: colors.primary }} size={40} />
          </div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            Complete Your Profile
          </h2>
          <p className="text-sm opacity-70" style={{ color: colors.text }}>
            Join thousands saving together globally.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-3xl overflow-hidden border-2 shadow-lg transition-transform group-hover:scale-105"
                style={{ borderColor: colors.primary }}
              >
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: colors.accentBg }}
                  >
                    <UserRound
                      size={52}
                      style={{ color: colors.primary }}
                      className="opacity-60"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={triggerFileInput}
                disabled={isProcessing}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-110 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Identity Info (ReadOnly) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Wallet Address
                </label>
                <div
                  className="px-4 py-3 rounded-2xl border text-xs font-mono break-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  {isAccountInitializing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span>Discovering Account...</span>
                    </div>
                  ) : (
                    formatAddress(accountAddress)
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Verified Email
                </label>
                <div
                  className="px-4 py-3 rounded-2xl border text-xs break-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  {user?.email || "No email"}
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border transition-all focus:ring-2 focus:ring-primary/20 outline-none pr-12"
                  style={{
                    backgroundColor: colors.background,
                    borderColor:
                      usernameAvailable === true
                        ? colors.successBorder
                        : usernameAvailable === false
                          ? colors.errorBorder
                          : colors.border,
                    color: colors.text,
                  }}
                  placeholder="how do we call you?"
                  disabled={isProcessing}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCheckingUsername ? (
                    <div
                      className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: colors.primary }}
                    />
                  ) : usernameAvailable === true ? (
                    <Check className="text-green-500" size={20} />
                  ) : usernameAvailable === false ? (
                    <AlertCircle className="text-red-500" size={20} />
                  ) : null}
                </div>
              </div>
              {usernameAvailable === false && (
                <p className="text-[10px] text-red-500 font-medium px-2">
                  This username is already taken.
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  placeholder="First"
                  disabled={isProcessing}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  placeholder="Last"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t" style={{ borderColor: colors.border }}>
          <button
            onClick={handleCompleteSetup}
            disabled={!isFormValid || isProcessing}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" text="Creating profile..." />
            ) : (
              <>
                <Check size={20} />
                Complete Setup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCreationModal;

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Loader,
  Check,
  Mail,
  Phone,
  Shield,
  Copy,
  CopyCheck,
  Pencil,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import UpdateContactModal from "@/app/components/UpdateContactModal";
import ReferralSection from "@/app/components/ReferralSection";
import { getInitials } from "@/app/utils/helpers";
import Image from "next/image";
import NavBar from "@/app/components/NavBar";

const ProfilePage = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const {
    profile,
    isLoading: isProfileLoading,
    updateProfile,
    refreshProfile,
  } = useUserProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contactModal, setContactModal] = useState<{
    type: "email" | "phone";
    currentValue?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPreviewImage(profile.profilePhoto || null);
    }
  }, [profile]);

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
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const nameChanged =
      firstName !== profile.firstName || lastName !== profile.lastName;
    const photoChanged = !!selectedFile;

    if (!nameChanged && !photoChanged) return;

    setIsUpdating(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        profilePhoto: photoChanged ? previewImage : undefined,
      });
      setSelectedFile(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLinkContact = (type: "email" | "phone") => {
    setContactModal({
      type,
      currentValue:
        (type === "email" ? profile?.email : profile?.phoneNumber) || undefined,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isProfileLoading && !profile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  const hasChanges =
    profile &&
    (firstName !== profile.firstName ||
      lastName !== profile.lastName ||
      !!selectedFile);

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="My Profile"
        onBack={() => router.back()}
        colors={colors}
      />

      <div className="max-w-2xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        {/* Profile Card */}
        <div
          className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 border shadow-sm space-y-6 sm:space-y-8"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div
                className="w-20 h-20 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 flex items-center justify-center bg-muted shadow-inner"
                style={{ borderColor: colors.primary }}
              >
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-30">
                    {getInitials(firstName + " " + lastName)}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                <Camera size={16} className="sm:hidden" />
                <Camera size={20} className="hidden sm:block" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {hasChanges && (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-1.5 sm:gap-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  {isUpdating ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setFirstName(profile?.firstName || "");
                    setLastName(profile?.lastName || "");
                    setPreviewImage(profile?.profilePhoto || null);
                    setSelectedFile(null);
                  }}
                  disabled={isUpdating}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-sm sm:text-base font-bold transition-colors hover:bg-black/5 disabled:opacity-50"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Account Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.username || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl border opacity-60 cursor-not-allowed font-medium text-xs sm:text-base"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <button
                  onClick={() =>
                    copyToClipboard(profile?.username || "", "Username")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-colors hover:bg-black/5"
                  style={{ color: colors.text }}
                >
                  {copiedField === "Username" ? (
                    <CopyCheck size={18} style={{ color: colors.primary }} />
                  ) : (
                    <Copy size={18} className="opacity-50" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                Account ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.accountId || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl border opacity-60 cursor-not-allowed font-mono text-[10px] sm:text-base"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      profile?.accountId?.toString() || "",
                      "Account ID",
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-colors hover:bg-black/5"
                  style={{ color: colors.text }}
                >
                  {copiedField === "Account ID" ? (
                    <CopyCheck size={18} style={{ color: colors.primary }} />
                  ) : (
                    <Copy size={18} className="opacity-50" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isUpdating}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl border text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <Pencil
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none"
                  style={{ color: colors.text }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-60">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isUpdating}
                  className="w-full px-3.5 py-2.5 sm:px-5 sm:py-3.5 pr-10 sm:pr-12 rounded-xl sm:rounded-2xl border text-sm sm:text-base transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <Pencil
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none"
                  style={{ color: colors.text }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <h3
              className="font-bold flex items-center gap-2"
              style={{ color: colors.text }}
            >
              <Shield size={20} style={{ color: colors.primary }} />
              Verified Contacts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div
                className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border space-y-3 sm:space-y-4"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail size={20} style={{ color: colors.primary }} />
                    <span className="font-bold text-sm">Email</span>
                  </div>
                  {profile?.email && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: colors.successBg,
                        color: colors.primary,
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium opacity-70 break-all">
                    {profile?.email || "No email linked"}
                  </p>
                  <button
                    onClick={() => handleLinkContact("email")}
                    className="p-1.5 rounded-xl transition-opacity hover:opacity-70"
                  >
                    <Pencil size={16} style={{ color: colors.primary }} />
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div
                className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border space-y-3 sm:space-y-4"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone size={20} style={{ color: colors.primary }} />
                    <span className="font-bold text-sm">Phone</span>
                  </div>
                  {profile?.phoneNumber && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: colors.successBg,
                        color: colors.primary,
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium opacity-70 break-all">
                    {profile?.phoneNumber || "No phone linked"}
                  </p>
                  <button
                    onClick={() => handleLinkContact("phone")}
                    className="p-1.5 rounded-xl transition-opacity hover:opacity-70"
                  >
                    <Pencil size={16} style={{ color: colors.primary }} />
                  </button>
                </div>
              </div>
            </div>

            {profile && <ReferralSection username={profile.username} />}
          </div>
        </div>
      </div>

      {/* Update Contact Modal */}
      {contactModal && (
        <UpdateContactModal
          type={contactModal.type}
          currentValue={contactModal.currentValue}
          onClose={() => setContactModal(null)}
          onSuccess={() => {
            refreshProfile();
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;

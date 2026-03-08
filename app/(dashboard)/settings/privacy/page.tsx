"use client";

import React, { useState } from "react";
import {
  LogOut,
  ShieldCheck,
  Lock,
  Eye,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NavBar from "@/app/components/NavBar";
import LogoutModal from "@/app/components/LogoutModal";

const PrivacySecurityPage = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { handleLogOut } = useDynamicContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const onLogout = async () => {
    try {
      await handleLogOut();
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const securityOptions = [
    {
      icon: <Lock size={18} />,
      title: "Biometric Authentication",
      description: "Enable Face ID or Fingerprint for quick access",
      enabled: true,
    },
    {
      icon: <Eye size={18} />,
      title: "Privacy Mode",
      description: "Hide your balance from the main dashboard",
      enabled: false,
    },
  ];

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Privacy & Security"
        onBack={() => router.back()}
        colors={colors}
      />

      <div className="max-w-2xl mx-auto px-2 sm:px-4 space-y-4 sm:space-y-6 mt-4 sm:mt-6">
        {/* Security Overview */}
        <div
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-8 border shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div
            className="p-3 rounded-2xl shrink-0"
            style={{ backgroundColor: colors.successBg + "20" }}
          >
            <ShieldCheck size={28} style={{ color: colors.primary }} />
          </div>
          <div>
            <h3
              className="font-bold text-base sm:text-lg"
              style={{ color: colors.text }}
            >
              Your account is secure
            </h3>
            <p
              className="text-xs sm:text-sm opacity-60"
              style={{ color: colors.text }}
            >
              2-Factor authentication is active via your verified contacts.
            </p>
          </div>
        </div>

        {/* Security Settings */}
        {/* <div
          className="rounded-2xl sm:rounded-3xl px-3.5 py-6 sm:p-8 border shadow-sm space-y-6"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-40">
            Security Settings
          </h3>

          <div className="space-y-1">
            {securityOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors hover:bg-black/5"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0"
                    style={{ backgroundColor: colors.accentBg }}
                  >
                    <div style={{ color: colors.primary }}>{option.icon}</div>
                  </div>
                  <div className="min-w-0">
                    <span
                      className="font-bold text-xs sm:text-sm block truncate"
                      style={{ color: colors.text }}
                    >
                      {option.title}
                    </span>
                    <span
                      className="text-[10px] sm:text-xs opacity-50 block truncate"
                      style={{ color: colors.text }}
                    >
                      {option.description}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-colors relative cursor-pointer ml-3`}
                  style={{
                    backgroundColor: option.enabled
                      ? colors.primary
                      : colors.border,
                  }}
                >
                  <div
                    className={`bg-white w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm transition-transform ${option.enabled ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`}
                  />
                </div>
              </div>
            ))}

            <button className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors hover:bg-black/5">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <ShieldAlert size={18} style={{ color: colors.primary }} />
                </div>
                <div className="text-left min-w-0">
                  <span
                    className="font-bold text-xs sm:text-sm block"
                    style={{ color: colors.text }}
                  >
                    Advanced Protection
                  </span>
                  <span
                    className="text-[10px] sm:text-xs opacity-50 block"
                    style={{ color: colors.text }}
                  >
                    Managed by Dynamic Non-custodial
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0"
                style={{ color: colors.textLight }}
              />
            </button>
          </div>
        </div> */}

        {/* Danger Zone / Logout */}
        <div
          className="rounded-2xl sm:rounded-3xl px-3.5 py-6 sm:p-8 border shadow-sm space-y-6"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-40 text-red-500">
            Account Actions
          </h3>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full p-4 sm:p-6 rounded-xl sm:rounded-3xl border flex items-center justify-between transition-all hover:bg-red-50 hover:border-red-200 group"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-2xl bg-red-100 group-hover:bg-red-500 transition-colors">
                <LogOut
                  size={18}
                  className="text-red-500 sm:size-[20px] group-hover:text-white transition-colors"
                />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm sm:text-base text-red-500">
                  Sign Out
                </span>
                <span
                  className="text-[10px] sm:text-xs opacity-60"
                  style={{ color: colors.text }}
                >
                  Disconnect from Circlepot
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={onLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
};

export default PrivacySecurityPage;

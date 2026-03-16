"use client";

import React from "react";
import { LogOut, X } from "lucide-react";
import { useThemeColors } from "../hooks/useThemeColors";

interface LogoutModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const colors = useThemeColors();

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div
            className="p-3 rounded-2xl"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <LogOut size={24} style={{ color: "#DC2626" }} />
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-black/5"
          >
            <X size={20} style={{ color: colors.textLight }} />
          </button>
        </div>

        <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
          Sign Out?
        </h3>
        <p
          className="opacity-70 text-xs sm:text-sm mb-6 sm:mb-8"
          style={{ color: colors.text }}
        >
          Are you sure you want to sign out of your account? You&apos;ll need to
          verify your email or phone to sign back in.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-50 text-sm sm:text-base"
            style={{ backgroundColor: "#DC2626" }}
          >
            {isLoading ? "Signing out..." : "Yes, Sign Out"}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold border transition-colors hover:bg-black/5 disabled:opacity-50 text-sm sm:text-base"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;

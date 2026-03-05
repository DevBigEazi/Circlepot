"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { getInitials } from "@/app/utils/helpers";
import Image from "next/image";

export interface Tab {
  id: string;
  label: string;
}

interface NavBarProps {
  title?: string;
  titleIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  colors: {
    background: string;
    border: string;
    surface: string;
    text: string;
    textLight?: string;
    primary?: string;
    gradient?: string;
    infoBg?: string;
    accentBg?: string;
  };
  userName?: string;
  fullName?: string;
  profileImage?: string | null;
  variant?: "default" | "minimal" | "tabs";
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  badge?: number;
  onActionClick?: () => void;
  actionButtonText?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  title,
  titleIcon,
  subtitle,
  onBack,
  actions,
  colors,
  userName = "User",
  fullName = "No Name",
  profileImage = null,
  variant = "default",
  badge = 0,
  onActionClick,
  actionButtonText,
}) => {
  const userInitials = getInitials(fullName);
  // Extract first name for the greeting, fallback to username if name is sparse
  const firstName =
    fullName && fullName !== "No Name" ? fullName.split(" ")[0] : userName;

  // Tabs variant (for pages like Notifications)
  if (variant === "tabs") {
    return (
      <div
        className="sticky top-0 z-10 w-full"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-xl transition hover:opacity-80"
                  style={{ color: colors.text }}
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {title && (
                <div className="flex items-center gap-3">
                  {titleIcon && (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <div className="text-white">{titleIcon}</div>
                      {badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <h1
                      className="text-xl font-bold"
                      style={{ color: colors.text }}
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <div
                        className="text-sm"
                        style={{ color: colors.textLight }}
                      >
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actionButtonText && (
                <button
                  onClick={onActionClick}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition border hover:opacity-80"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  {actionButtonText}
                </button>
              )}
              {actions}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant (for Profile etc)
  if (variant === "minimal") {
    return (
      <div
        className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
        style={{
          backgroundColor: `${colors.background}cc`,
          borderColor: colors.border,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: colors.text }}
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              {title && (
                <div className="flex items-center gap-2 overflow-hidden">
                  {titleIcon && (
                    <div className="shrink-0" style={{ color: colors.primary }}>
                      {titleIcon}
                    </div>
                  )}
                  <h1
                    className="text-lg font-bold leading-tight truncate"
                    style={{ color: colors.text }}
                  >
                    {title}
                  </h1>
                </div>
              )}
            </div>
            <div className="flex gap-2 items-center shrink-0">{actions}</div>
          </div>
          {subtitle && (
            <div
              className="text-xs mt-1 ml-13"
              style={{ color: colors.textLight }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant (Home Greeting)
  return (
    <header
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md"
      style={{
        backgroundColor: `${colors.background}cc`,
        borderColor: colors.border,
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 mr-2 rounded-xl transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ArrowLeft size={20} style={{ color: colors.text }} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center relative bg-gray-100 dark:bg-gray-800">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                    {userInitials}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div
                  className="text-sm font-bold leading-none"
                  style={{ color: colors.text }}
                >
                  Hi, {firstName}
                </div>
                <div
                  className="text-[10px] sm:text-xs mt-1 font-medium"
                  style={{ color: colors.text, opacity: 0.6 }}
                >
                  Let's make today count! 💫
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">{actions}</div>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;

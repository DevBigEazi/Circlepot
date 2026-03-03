"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  Search,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Bell,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ThemeToggle from "@/app/components/ThemeToggle";
import LogoutModal from "@/app/components/LogoutModal";
import { getInitials } from "@/app/utils/helpers";

const SettingsPage = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { handleLogOut } = useDynamicContext();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();
  const { profile } = useUserProfile();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogout = async () => {
    try {
      await handleLogOut();
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const filteredCurrencies = Object.keys(availableCurrencies).filter((code) => {
    const currency = availableCurrencies[code];
    return (
      code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(currencySearch.toLowerCase())
    );
  });

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 p-4 flex items-center justify-between border-b backdrop-blur-md"
        style={{
          backgroundColor: `${colors.surface}cc`,
          borderColor: colors.border,
        }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full transition-colors hover:bg-black/5"
        >
          <ArrowLeft size={24} style={{ color: colors.text }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: colors.text }}>
          Settings
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {/* Profile Card Navigation */}
        <button
          onClick={() => router.push("/profile")}
          className="w-full text-left rounded-3xl p-6 border shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden border flex items-center justify-center bg-muted shadow-inner"
              style={{ borderColor: colors.border }}
            >
              {profile?.profilePhoto ? (
                <Image
                  src={profile.profilePhoto}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold opacity-30">
                  {getInitials(
                    profile ? `${profile.firstName} ${profile.lastName}` : "",
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-lg truncate"
                style={{ color: colors.text }}
              >
                {profile
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Your Name"}
              </h3>
              <p
                className="text-sm opacity-60 truncate"
                style={{ color: colors.text }}
              >
                @{profile?.username || "username"}
              </p>
            </div>
          </div>
          <ChevronRight size={24} style={{ color: colors.textLight }} />
        </button>

        {/* Preferences Section */}
        <div
          className="rounded-3xl p-8 border shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-40">
            Preferences
          </h3>

          <div className="space-y-8">
            {/* Theme */}
            <div className="space-y-3">
              <label
                className="text-sm font-bold block"
                style={{ color: colors.text }}
              >
                Appearance
              </label>
              <ThemeToggle />
            </div>

            {/* Currency */}
            <div className="space-y-3">
              <label
                className="text-sm font-bold block"
                style={{ color: colors.text }}
              >
                Local Currency
              </label>
              <div className="relative" ref={currencyDropdownRef}>
                <button
                  onClick={() =>
                    setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)
                  }
                  className="w-full px-5 py-3.5 rounded-2xl border flex items-center justify-between transition-all hover:bg-black/5"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.text,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {availableCurrencies[selectedCurrency]?.flag && (
                      <Image
                        src={availableCurrencies[selectedCurrency].flag}
                        alt=""
                        width={24}
                        height={16}
                        className="w-6 h-4 object-cover rounded shadow-sm"
                      />
                    )}
                    <span className="font-bold text-sm">
                      {availableCurrencies[selectedCurrency]?.name ||
                        "Select Currency"}{" "}
                      ({selectedCurrency})
                    </span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${isCurrencyDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isCurrencyDropdownOpen && (
                  <div
                    className="absolute z-50 mt-2 w-full max-h-80 overflow-hidden rounded-3xl shadow-2xl border animate-in fade-in slide-in-from-top-2"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <div
                      className="p-4 border-b sticky top-0 bg-inherit"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="relative">
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                          size={18}
                        />
                        <input
                          type="text"
                          placeholder="Search currency..."
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                          style={{
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text,
                          }}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-60 custom-scrollbar p-2">
                      {filteredCurrencies.map((code) => (
                        <button
                          key={code}
                          onClick={() => {
                            setSelectedCurrency(code);
                            setIsCurrencyDropdownOpen(false);
                            setCurrencySearch("");
                            toast.success(`Switched to ${code}`);
                          }}
                          className="w-full px-4 py-3 rounded-2xl flex items-center gap-4 transition-colors hover:bg-black/5 text-left"
                        >
                          <div className="relative w-8 h-5 shrink-0">
                            {availableCurrencies[code].flag ? (
                              <Image
                                src={availableCurrencies[code].flag}
                                alt=""
                                width={32}
                                height={20}
                                className="w-full h-full object-cover rounded shadow-sm"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted rounded shadow-sm" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-bold text-sm"
                              style={{ color: colors.text }}
                            >
                              {code}
                            </div>
                            <div
                              className="text-xs opacity-60 truncate"
                              style={{ color: colors.text }}
                            >
                              {availableCurrencies[code].name}
                            </div>
                          </div>
                          {selectedCurrency === code && (
                            <Check
                              size={18}
                              style={{ color: colors.primary }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div
          className="rounded-3xl p-8 border shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-40">
            System & Support
          </h3>

          <div className="space-y-1">
            <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-black/5">
              <div className="flex items-center gap-4">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <Bell size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: colors.text }}
                >
                  Notifications
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-black/5">
              <div className="flex items-center gap-4">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <HelpCircle size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: colors.text }}
                >
                  Help & Support
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>

            <button className="w-full flex items-center justify-between p-4 rounded-2xl transition-colors hover:bg-black/5">
              <div className="flex items-center gap-4">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <ShieldCheck size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: colors.text }}
                >
                  Privacy & Security
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full p-6 rounded-3xl border flex items-center justify-between transition-all hover:bg-red-50 hover:border-red-200 group"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-100 group-hover:bg-red-500 transition-colors">
              <LogOut
                size={20}
                className="text-red-500 group-hover:text-white transition-colors"
              />
            </div>
            <div className="text-left">
              <span className="block font-bold text-red-500">Sign Out</span>
              <span
                className="text-xs opacity-60"
                style={{ color: colors.text }}
              >
                Disconnect from Circlepot
              </span>
            </div>
          </div>
        </button>
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

export default SettingsPage;

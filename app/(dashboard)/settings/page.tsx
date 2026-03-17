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
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ThemeToggle from "@/app/components/ThemeToggle";
import { getInitials } from "@/app/utils/helpers";
import NavBar from "@/app/components/NavBar";

const SettingsPage = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();
  const { profile } = useUserProfile();

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

  const filteredCurrencies = Object.keys(availableCurrencies).filter((code) => {
    const currency = availableCurrencies[code];
    return (
      code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      currency.name.toLowerCase().includes(currencySearch.toLowerCase())
    );
  });

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Settings"
        onBack={() => router.back()}
        colors={colors}
      />

      <div className="max-w-2xl mx-auto px-2 sm:px-4 space-y-3.5 sm:space-y-4 mt-4 sm:mt-6">
        {/* Profile Card Navigation */}
        <button
          onClick={() => router.push("/profile")}
          className="w-full text-left rounded-2xl sm:rounded-3xl p-4 sm:p-6 border shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border flex items-center justify-center bg-muted shadow-inner shrink-0"
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
          className="rounded-2xl sm:rounded-3xl px-3.5 py-6 sm:p-8 border shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 opacity-40">
            Preferences
          </h3>

          <div className="space-y-6 sm:space-y-8">
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
                  className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border flex items-center justify-between transition-all hover:bg-black/5"
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
                    className="absolute z-50 mt-2 w-full max-h-80 overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border animate-in fade-in slide-in-from-top-2"
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
                          className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
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
          className="rounded-2xl sm:rounded-3xl px-3.5 py-6 sm:p-8 border shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 opacity-40">
            System & Support
          </h3>

          <div className="space-y-1">
            <button 
              onClick={() => router.push("/settings/notifications")}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors hover:bg-black/5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <Bell size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Notifications
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>

            <button className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors hover:bg-black/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <HelpCircle size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Help & Support
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>

            <button
              onClick={() => router.push("/settings/privacy")}
              className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors hover:bg-black/5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: colors.accentBg }}
                >
                  <ShieldCheck size={18} style={{ color: colors.primary }} />
                </div>
                <span
                  className="font-bold text-xs sm:text-sm"
                  style={{ color: colors.text }}
                >
                  Privacy & Security
                </span>
              </div>
              <ChevronRight size={18} style={{ color: colors.textLight }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

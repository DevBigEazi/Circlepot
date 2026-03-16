"use client";

import React from "react";
import { X, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import Image from "next/image";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({ isOpen, onClose }) => {
  const colors = useThemeColors();
  const router = useRouter();
  const { selectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();

  if (!isOpen) return null;

  const currencyInfo = availableCurrencies[selectedCurrency];

  const handleInternalClick = () => {
    router.push("/profile");
    onClose();
  };

  const handleLocalClick = () => {
    router.push("/local-methods");
    onClose();
  };

  const handleExternalClick = () => {
    router.push("/external-wallets");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-md bg-surface rounded-t-4xl sm:rounded-2xl shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-0 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-xl sm:text-2xl font-black tracking-tight"
              style={{ color: colors.text }}
            >
              Add Funds
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition hover:bg-black/5"
              style={{ backgroundColor: colors.background }}
            >
              <X size={20} style={{ color: colors.text }} />
            </button>
          </div>

          <div className="space-y-4">
            <p
              className="text-xs sm:text-sm font-medium opacity-50 px-1"
              style={{ color: colors.text }}
            >
              Choose how you&apos;d like to top up your balance.
            </p>

            <button
              onClick={handleInternalClick}
              className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
              style={{ backgroundColor: colors.background }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: colors.primary + "1a",
                  color: colors.primary,
                }}
              >
                <Image
                  src="/assets/images/logo.png"
                  alt="logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm sm:text-base truncate" style={{ color: colors.text }}>
                  Add Internally
                </h3>
                <p className="text-[10px] sm:text-xs font-bold opacity-40 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  Use ID, username or email. Find yours in{" "}
                  <span className="underline font-medium">Profile</span>
                </p>
              </div>
              <ArrowRight
                size={18}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: colors.primary }}
              />
            </button>

            <button
              onClick={handleLocalClick}
              className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
              style={{ backgroundColor: colors.background }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform border-2 border-transparent group-hover:border-primary/20 shrink-0"
                style={{ backgroundColor: colors.primary + "1a" }}
              >
                {currencyInfo?.flag ? (
                  <Image
                    src={currencyInfo.flag}
                    alt={selectedCurrency}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <CreditCard size={24} style={{ color: colors.primary }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm sm:text-base truncate" style={{ color: colors.text }}>
                  Local Methods
                </h3>
                <p className="text-[10px] sm:text-xs font-bold opacity-40 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  Use your preferred local payment methods
                </p>
              </div>
              <ArrowRight
                size={18}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: colors.primary }}
              />
            </button>

            <button
              onClick={handleExternalClick}
              className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
              style={{ backgroundColor: colors.background }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: colors.primary + "1a",
                  color: colors.primary,
                }}
              >
                <Wallet size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm sm:text-base truncate" style={{ color: colors.text }}>
                  Wallet or Exchanges
                </h3>
                <p className="text-[10px] sm:text-xs font-bold opacity-40 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: colors.text }}>
                  Direct USDT deposits from external wallets
                </p>
              </div>
              <ArrowRight
                size={18}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: colors.primary }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;

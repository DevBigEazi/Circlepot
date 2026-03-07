"use client";

import React from "react";
import { X, ArrowRight, Wallet, CreditCard } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import Image from "next/image";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const colors = useThemeColors();
  const router = useRouter();
  const { selectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();

  if (!isOpen) return null;

  const currencyInfo = availableCurrencies[selectedCurrency];

  const handleInternalClick = () => {
    router.push("/withdraw/internal");
    onClose();
  };

  const handleLocalClick = () => {
    router.push("/withdraw/local");
    onClose();
  };

  const handleExternalClick = () => {
    router.push("/withdraw/external");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text }}>
            Withdraw Funds
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ backgroundColor: colors.background }}
          >
            <X size={20} style={{ color: colors.text }} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm px-1" style={{ color: colors.textLight }}>
            Choose how you&apos;d like to withdraw your funds.
          </p>

          <button
            onClick={handleInternalClick}
            className="w-full p-4 rounded-2xl border-2 border-transparent transition-all hover:border-primary/30 group flex items-center gap-4 text-left"
            style={{ backgroundColor: colors.background }}
          >
            <div
              className="p-2 rounded-xl group-hover:scale-110 transition-transform flex items-center justify-center"
              style={{
                backgroundColor: colors.primary + "1a",
                color: colors.primary,
              }}
            >
              <Image
                src="/assets/images/logo.png"
                alt="logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Internal Transfer
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Send to Circlepot users
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
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform border-2 border-transparent group-hover:border-primary/20"
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
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Local Offramp
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Withdraw to bank or mobile money
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
              className="p-3 rounded-xl group-hover:scale-110 transition-transform flex items-center justify-center"
              style={{
                backgroundColor: colors.primary + "1a",
                color: colors.primary,
              }}
            >
              <Wallet size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: colors.text }}>
                Wallet or Exchanges
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textLight }}>
                Transfer to external wallet
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
  );
};

export default WithdrawModal;

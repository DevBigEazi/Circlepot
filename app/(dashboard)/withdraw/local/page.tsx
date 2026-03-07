"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useCurrency } from "@/app/components/CurrencyProvider";
import { useCurrencyConverter } from "@/app/hooks/useCurrencyConverter";
import NavBar from "@/app/components/NavBar";
import Image from "next/image";

const WithdrawLocalPage: React.FC = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { selectedCurrency } = useCurrency();
  const { availableCurrencies } = useCurrencyConverter();

  const currencyInfo = availableCurrencies[selectedCurrency];

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => router.back()}
        title="Withdraw to Bank"
        subtitle="Withdraw to local bank or mobile money"
        titleIcon={
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
            {currencyInfo?.flag ? (
              <Image
                src={currencyInfo.flag}
                alt={selectedCurrency}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <CreditCard size={18} className="text-white" />
            )}
          </div>
        }
        colors={colors}
      />

      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            <p className="text-sm px-1" style={{ color: colors.textLight }}>
              We&apos;re currently expanding our local withdrawal options to
              provide you with more ways to access your funds.
            </p>

            <div
              className="p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100"
                style={{ backgroundColor: colors.background }}
              >
                {currencyInfo?.flag ? (
                  <Image
                    src={currencyInfo.flag}
                    alt={selectedCurrency}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover grayscale opacity-30"
                    unoptimized
                  />
                ) : (
                  <CreditCard size={40} className="text-gray-300" />
                )}
              </div>
              <div className="space-y-2">
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Coming Soon!
                </h3>
                <p
                  className="max-w-xs mx-auto text-sm"
                  style={{ color: colors.textLight }}
                >
                  We&apos;re working hard to integrate local withdrawal methods
                  for{" "}
                  <span className="font-bold" style={{ color: colors.primary }}>
                    {currencyInfo?.name || selectedCurrency}
                  </span>
                  . Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawLocalPage;

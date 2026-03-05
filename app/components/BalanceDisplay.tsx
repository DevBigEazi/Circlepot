"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, Info, Star } from "lucide-react";
import { CreditScore } from "../types/credit";
import { useThemeColors } from "../hooks/useThemeColors";
import { useCurrency } from "./CurrencyProvider";
import { useCurrencyConverter } from "../hooks/useCurrencyConverter";

interface BalanceDisplayProps {
  balance: string;
  creditScore?: CreditScore;
  circleCommitted?: number;
  circleCollateral?: number;
  circleContributions?: number;
  personalSavingsCommitted?: number;
  isLoading?: boolean;
}

export default function BalanceDisplay({
  balance,
  creditScore,
  circleCommitted = 0,
  circleCollateral = 0,
  circleContributions = 0,
  personalSavingsCommitted = 0,
  isLoading = false,
}: BalanceDisplayProps) {
  const colors = useThemeColors();
  const { selectedCurrency } = useCurrency();
  const { convertToLocal, availableCurrencies } = useCurrencyConverter();
  const [showBalance, setShowBalance] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("showBalance");
    if (saved !== null) setShowBalance(JSON.parse(saved));
  }, []);

  const toggleVisibility = () => {
    const newVal = !showBalance;
    setShowBalance(newVal);
    localStorage.setItem("showBalance", JSON.stringify(newVal));
  };

  const totalDisplayBalance =
    Number(balance) + circleCommitted + personalSavingsCommitted;

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 shadow-sm border space-y-6 animate-pulse"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-border/50 rounded" />
              <div className="w-24 h-4 bg-border/50 rounded" />
            </div>
            <div className="w-40 h-10 bg-border/50 rounded" />
            <div className="w-32 h-4 bg-border/50 rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-12 flex-1 bg-border/50 rounded-xl" />
          <div className="h-12 flex-1 bg-border/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 shadow-sm border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} style={{ color: colors.primary }} />
            <h2 className="font-semibold" style={{ color: colors.text }}>
              Total Balance
            </h2>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-1 rounded-full transition hover:opacity-80"
                style={{ color: colors.textLight }}
                aria-label="Balance breakdown"
              >
                <Info size={16} />
              </button>

              {showTooltip && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-64 sm:w-72 p-4 rounded-xl shadow-lg border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <h4
                    className="font-bold text-sm mb-2"
                    style={{ color: colors.text }}
                  >
                    Balance Breakdown
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Available USDT:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${Number(balance).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Circle Contributions:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${circleContributions.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Collateral Locked:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${circleCollateral.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: colors.textLight }}>
                        Personal Savings:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        ${personalSavingsCommitted.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="pt-2 mt-2 border-t flex justify-between text-xs font-bold"
                      style={{ borderColor: colors.border }}
                    >
                      <span style={{ color: colors.text }}>Total:</span>
                      <span style={{ color: colors.primary }}>
                        ${totalDisplayBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p
                    className="mt-3 text-[10px] leading-relaxed"
                    style={{ color: colors.textLight }}
                  >
                    Your total balance includes funds you can spend and funds
                    locked in savings goals or circles.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <h1
              className="text-lg sm:text-3xl font-bold"
              style={{ color: colors.text }}
            >
              {showBalance
                ? `$${totalDisplayBalance.toFixed(2)} USDT`
                : "••••••"}
            </h1>
            <button
              onClick={toggleVisibility}
              className="p-1.5 rounded-lg transition hover:bg-black/5"
              style={{ color: colors.textLight }}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showBalance && selectedCurrency !== "USD" && (
            <div
              className="text-[10px] sm:text-xs font-bold mt-0.5 opacity-60 flex items-center gap-1"
              style={{ color: colors.text }}
            >
              ≈ {availableCurrencies[selectedCurrency]?.symbol || ""}
              {convertToLocal(totalDisplayBalance, selectedCurrency)}{" "}
              {selectedCurrency}
            </div>
          )}
        </div>

        <div
          className="px-2 py-1 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 leading-none h-fit"
          style={{ backgroundColor: colors.background, color: colors.primary }}
        >
          <img
            src="/assets/images/tether-usdt-logo.svg"
            alt="USDT"
            className="w-3 h-3 rounded-full"
          />
          USDT
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <button
          className="flex-1 py-3 px-3 rounded-xl text-sm font-bold text-white transition-all transform active:scale-95 shadow-md hover:opacity-90"
          style={{ background: colors.primary }}
        >
          Add Funds
        </button>
        <button
          className="flex-1 py-3 px-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 border hover:bg-black/5"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          }}
        >
          Withdraw
        </button>
      </div>

      <div
        className="mt-6 pt-6 border-t"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Star size={14} className="text-white fill-white" />
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: colors.text }}
            >
              Credit Score
            </span>
          </div>
          <div className="text-right">
            <span
              className="text-lg font-bold"
              style={{ color: creditScore?.categoryColor || colors.text }}
            >
              {creditScore?.score || 300}
            </span>
            <div
              className="text-[10px] font-medium"
              style={{ color: colors.textLight }}
            >
              {creditScore?.categoryLabel || "Poor"}
            </div>
          </div>
        </div>

        <div
          className="relative h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border }}
        >
          <div
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
            style={{
              width: `${(((creditScore?.score || 300) - 300) / (850 - 300)) * 100}%`,
              backgroundColor: creditScore?.categoryColor || colors.primary,
            }}
          />
        </div>
      </div>
    </div>
  );
}

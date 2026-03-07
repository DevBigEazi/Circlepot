"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useBalance } from "@/app/hooks/useBalance";
import { useTransfer } from "@/app/hooks/useTransfer";
import { toast } from "sonner";
import { parseUnits } from "viem";

const WithdrawExternalPage: React.FC = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { balance, formattedBalance, refetch: refetchBalance } = useBalance();
  const {
    transfer,
    isTransferring,
    error: transferError,
    withdrawalFee,
  } = useTransfer();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleMaxAmount = () => {
    if (balance) {
      // Amount = Total Balance - Withdrawal Fee
      const feeWei = parseUnits(withdrawalFee, 6);
      const maxAvailable = balance > feeWei ? balance - feeWei : 0n;
      // Convert back to decimal string (USDT 6 decimals)
      setAmount((Number(maxAvailable) / 1e6).toString());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidAddress(address)) {
      toast.error("Invalid wallet address");
      return;
    }

    const amountWei = parseUnits(amount, 6);
    const feeWei = parseUnits(withdrawalFee, 6);
    const totalRequired = amountWei + feeWei;

    if (balance && totalRequired > balance) {
      toast.error(
        `Insufficient balance. You need ${amount} + ${withdrawalFee} USDT fee.`,
      );
      return;
    }

    try {
      await transfer(address, amountWei, true);
      setIsSuccess(true);
      toast.success("Withdrawal successful!");
      refetchBalance();
    } catch (err) {
      console.error(err);
      // Error handled by useTransfer and toast
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: colors.successBg }}
        >
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
          Transfer Sent!
        </h2>
        <p
          className="mb-8 max-w-xs text-sm"
          style={{ color: colors.textLight }}
        >
          Your withdrawal to {address.slice(0, 6)}...{address.slice(-4)} has
          been processed successfully.
        </p>
        <div className="space-y-4 w-full max-w-xs">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
            style={{ background: colors.primary }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar
        variant="minimal"
        onBack={() => router.back()}
        title="Withdraw to Wallet"
        subtitle="Send funds to external wallet"
        titleIcon={<Wallet size={18} className="text-white" />}
        colors={colors}
      />

      <div
        className="min-h-screen pb-20 pt-4"
        style={{ backgroundColor: colors.background }}
      >
        <div className="max-w-xl mx-auto px-4 space-y-6">
          {/* Instructions Card */}
          <div
            className="p-5 rounded-3xl border-2 border-dashed flex gap-4 items-start"
            style={{
              backgroundColor: colors.primary + "05",
              borderColor: colors.primary + "20",
            }}
          >
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Info size={20} style={{ color: colors.primary }} />
            </div>
            <div className="space-y-2">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: colors.text }}
              >
                How to withdraw
              </h4>
              <ol
                className="text-[11px] leading-relaxed font-semibold space-y-1 ml-4 list-decimal"
                style={{ color: colors.textLight }}
              >
                <li>
                  Open your external wallet and tap <strong>Deposit</strong>.
                </li>
                <li>
                  Select <strong>USDT</strong> as the token.
                </li>
                <li>
                  Select the <strong>Avalanche C-Chain</strong> (Critical!).
                </li>
                <li>Copy and paste that address below.</li>
                <li>Enter amount and send.</li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            <div
              className="p-6 rounded-3xl space-y-2 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: colors.textLight }}
              >
                Available Balance
              </span>
              <div className="flex items-baseline gap-2">
                <h2
                  className="text-3xl font-bold"
                  style={{ color: colors.text }}
                >
                  {formattedBalance}
                </h2>
                <span
                  className="text-lg font-medium"
                  style={{ color: colors.textLight }}
                >
                  USDT
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold ml-1"
                  style={{ color: colors.text }}
                >
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold ml-1"
                  style={{ color: colors.text }}
                >
                  Amount to Withdraw
                </label>
                <div className="relative flex flex-col gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none pr-24 font-bold"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleMaxAmount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-tight transition-colors"
                      style={{
                        backgroundColor: colors.primary + "15",
                        color: colors.primary,
                      }}
                    >
                      MAX
                    </button>
                  </div>
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: colors.textLight }}
                  >
                    <strong>{withdrawalFee} USDT</strong> withdrawal fee is
                    charged on all external withdrawals.
                  </p>
                </div>
              </div>
            </div>

            {transferError && (
              <div
                className="p-4 rounded-2xl text-sm flex gap-3 items-start border"
                style={{
                  backgroundColor: colors.errorBg,
                  color: "#EF4444",
                  borderColor: colors.errorBorder,
                }}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="font-medium">{transferError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isTransferring || !address || !amount}
              className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: colors.primary,
              }}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Processing...
                </>
              ) : (
                <>
                  Withdraw Funds
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div
            className="p-4 rounded-2xl border-2 border-dashed flex gap-4 items-center"
            style={{ borderColor: colors.border }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.infoBg }}
            >
              <Info size={20} style={{ color: colors.primary }} />
            </div>
            <p
              className="text-xs leading-relaxed font-medium"
              style={{ color: colors.textLight }}
            >
              <strong>Important:</strong> Only send to a wallet on the{" "}
              <strong>Avalanche Network</strong>. Sending to the wrong network
              may result in permanent loss of funds. Blockchain transactions are
              irreversible.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawExternalPage;

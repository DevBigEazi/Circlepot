"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useBalance } from "@/app/hooks/useBalance";
import { useTransfer } from "@/app/hooks/useTransfer";
import { toast } from "sonner";
import { parseUnits } from "viem";
import Image from "next/image";
import { handleSmartAccountError } from "@/lib/error-handler";
import TransactionPreviewModal from "@/app/components/modals/TransactionPreviewModal";

const WithdrawInternalPage: React.FC = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { balance, formattedBalance, refetch: refetchBalance } = useBalance();
  const { transfer, isTransferring, error: transferError } = useTransfer();

  const [searchInput, setSearchInput] = useState("");
  const [recipient, setRecipient] = useState<
    import("@/app/types/profile").Profile | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchInput.trim();
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/profile/search?query=${encodeURIComponent(query)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setRecipient(data);
          } else {
            setRecipient(null);
          }
        } catch (err) {
          console.error("Search failed", err);
          setRecipient(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setRecipient(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleMaxAmount = () => {
    if (balance) {
      setAmount((Number(balance) / 1e6).toString());
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient?.walletAddress) {
      toast.error("Please select a valid recipient");
      return;
    }
    const amountWei = parseUnits(amount, 6);
    if (balance && amountWei > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setShowPreview(true);
  };

  const confirmInternalTransfer = async () => {
    if (!recipient?.walletAddress) return;
    const amountWei = parseUnits(amount, 6);
    try {
      await transfer(recipient.walletAddress, amountWei, false); // false = internal
      setIsSuccess(true);
      setShowPreview(false);
      toast.success("Transfer successful!");
      refetchBalance();
    } catch (err) {
      console.error(err);
      toast.error(handleSmartAccountError(err));
    }
  };

  if (isSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
          style={{ backgroundColor: colors.successBg }}
        >
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: colors.text }}>
          Transfer Successful!
        </h2>
        <p
          className="mb-8 font-medium text-sm"
          style={{ color: colors.textLight }}
        >
          Sent{" "}
          <span className="font-bold" style={{ color: colors.primary }}>
            {amount} USDT
          </span>{" "}
          to @{recipient?.username || recipient?.firstName}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95"
          style={{ background: colors.primary }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        onBack={() => router.back()}
        title="Internal Transfer"
        subtitle="Instantly send to users"
        titleIcon={<User size={18} className="text-white" />}
        colors={colors}
      />
      <div className="flex-1 pb-12 pt-4 px-4 overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Instruction Card */}
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
            <div className="space-y-1">
              <h4
                className="text-xs font-black uppercase tracking-wider"
                style={{ color: colors.text }}
              >
                How to send
              </h4>
              <p
                className="text-[11px] leading-relaxed font-semibold opacity-80"
                style={{ color: colors.textLight }}
              >
                Search for recipients using their{" "}
                <span style={{ color: colors.primary }}>Username</span>,
                <span style={{ color: colors.primary }}> Email</span>, or{" "}
                <span style={{ color: colors.primary }}> Account ID</span>.
                Transfers to other Circlepot users are{" "}
                <strong>always instant and 100% free</strong>. No withdrawal
                fees required!
              </p>
            </div>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-6">
            {/* Balance Card */}
            <div
              className="p-6 rounded-4xl border-2 shadow-sm flex justify-between items-center"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="space-y-1">
                <span
                  className="text-[10px] font-black uppercase tracking-widest opacity-50 block"
                  style={{ color: colors.text }}
                >
                  Available Balance
                </span>
                <div className="flex items-baseline gap-2">
                  <h2
                    className="text-3xl font-black"
                    style={{ color: colors.text }}
                  >
                    {Number(formattedBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h2>
                  <span className="text-sm font-bold opacity-60">USDT</span>
                </div>
              </div>
              <div
                className="p-3 rounded-2xl"
                style={{
                  backgroundColor: colors.primary + "1a",
                  color: colors.primary,
                }}
              >
                <User size={24} />
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="text-xs font-black uppercase tracking-widest ml-1 opacity-60"
                style={{ color: colors.text }}
              >
                Find Recipient
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  placeholder="Username, Email or ID"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 rounded-2xl border-2 outline-none font-bold transition-all"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                {isSearching && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{ color: colors.primary }}
                    />
                  </div>
                )}
              </div>

              {recipient && (
                <div
                  className="p-5 rounded-3xl border-2 flex items-center gap-4 animate-in slide-in-from-top-2"
                  style={{
                    backgroundColor: colors.primary + "05",
                    borderColor: colors.primary + "30",
                  }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white border shadow-sm flex items-center justify-center">
                    {recipient.profilePhoto ? (
                      <Image
                        src={recipient.profilePhoto}
                        alt={recipient.username}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-black truncate"
                      style={{ color: colors.text }}
                    >
                      {recipient.firstName} {recipient.lastName}
                    </h4>
                    <span
                      className="text-xs font-bold"
                      style={{ color: colors.primary }}
                    >
                      @{recipient.username}
                    </span>
                  </div>
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label
                  className="text-xs font-black uppercase tracking-widest opacity-60"
                  style={{ color: colors.text }}
                >
                  Amount to send
                </label>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="text-[10px] font-black px-3 py-1 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: colors.primary + "15",
                    color: colors.primary,
                  }}
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-6 py-4 rounded-2xl border-2 outline-none font-black text-2xl"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-lg opacity-30">
                  USDT
                </div>
              </div>
            </div>

            {transferError && (
              <div
                className="p-5 rounded-3xl border-2 text-sm flex gap-4 items-center"
                style={{
                  backgroundColor: colors.errorBg,
                  color: "#EF4444",
                  borderColor: "#EF444430",
                }}
              >
                <AlertCircle size={20} className="shrink-0" />
                <p className="font-bold">{transferError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isTransferring || !recipient || !amount}
              className="w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: colors.primary }}
            >
              {isTransferring ? (
                <Loader2 className="animate-spin" size={26} />
              ) : (
                "Send Instantly"
              )}
            </button>
          </form>
        </div>
      </div>

      {recipient && (
        <TransactionPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={confirmInternalTransfer}
          isProcessing={isTransferring}
          type="internal"
          amount={amount}
          recipient={recipient}
          fee="0"
          total={amount}
        />
      )}
    </div>
  );
};

export default WithdrawInternalPage;

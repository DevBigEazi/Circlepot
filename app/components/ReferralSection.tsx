"use client";

import React, { useState } from "react";
import { Users, Gift, Copy, Check, Share2 } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import { useReferralData } from "@/app/hooks/useReferralData";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatUnits } from "viem";

interface ReferralSectionProps {
  username: string;
}

const ReferralSection: React.FC<ReferralSectionProps> = ({ username }) => {
  const colors = useThemeColors();
  const { data: referralData, isLoading: isLoadingData } = useReferralData();
  const [copied, setCopied] = useState(false);

  // Fetch settings for bonus amount
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["referralSettings"],
    queryFn: async () => {
      const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
      if (!SUBGRAPH_URL) return { rewardsEnabled: false, supportedTokens: [] };
      const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetReferralSettings {
              referralSystem(id: "system") {
                id
                rewardsEnabled
                supportedTokens {
                  token
                  bonusAmount
                }
              }
            }
          `,
        }),
      });
      const { data } = await response.json();
      return (
        data?.referralSystem || { rewardsEnabled: false, supportedTokens: [] }
      );
    },
  });

  // Use username as the referral code, following the React app's logic
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}?ref=${username}`
      : `?ref=${username}`;

  const handleCopy = () => {
    if (!username) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Circlepot!",
          text: `Save in dollars with me on Circlepot! Use my link:`,
          url: referralLink,
        });
      } catch {
        // console.log("Share cancelled");
      }
    } else {
      handleCopy();
    }
  };

  const isEnabled = settings?.rewardsEnabled;
  const activeToken = settings?.supportedTokens?.find(
    (t: { bonusAmount: string }) => BigInt(t.bonusAmount) > BigInt(0),
  );
  const bonusVal = activeToken ? BigInt(activeToken.bonusAmount) : BigInt(0);
  const bonusAmount = formatUnits(bonusVal, 18); // USDC/Token usually 18 in this contract
  const hasBonus = isEnabled && bonusVal > BigInt(0);

  const isLoading = isLoadingData || isLoadingSettings;

  return (
    <div
      className="rounded-2xl py-6 border mt-6"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <Gift size={20} />
        </div>
        <div>
          <h4 className="font-bold text-lg" style={{ color: colors.text }}>
            {isLoadingSettings
              ? "..."
              : hasBonus
                ? `Share & Earn`
                : "Invite Your Friends"}
          </h4>
          <p className="text-xs" style={{ color: colors.textLight }}>
            {isLoadingSettings
              ? "Loading rewards..."
              : hasBonus
                ? `Invite friends and earn $${bonusAmount} USDm`
                : "Invite friends to join Circlepot"}
          </p>
        </div>
      </div>

      {/* Stats Grid - React design 2 cols */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div
            className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60"
            style={{ color: colors.text }}
          >
            <Users size={14} />
            <span>Referrals</span>
          </div>
          <p className="text-xl font-bold" style={{ color: colors.text }}>
            {isLoading ? "..." : referralData?.referralCount || 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
          <div
            className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider opacity-60"
            style={{ color: colors.text }}
          >
            <Gift size={14} />
            <span>Earned</span>
          </div>
          <div>
            <p className="text-xl font-bold text-green-500">
              {isLoading
                ? "..."
                : `$${formatUnits(referralData?.totalEarned || BigInt(0), 18)}`}
            </p>
            {referralData?.pendingEarned &&
              referralData.pendingEarned > BigInt(0) && (
                <p className="text-[10px] text-amber-500 font-bold mt-0.5">
                  + ${formatUnits(referralData.pendingEarned, 18)} Pending
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Copy Input - React design */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div
            className="flex-1 px-4 py-3 rounded-xl border text-sm truncate"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.textLight,
            }}
          >
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="w-12 h-12 rounded-xl flex items-center justify-center border transition hover:opacity-80"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            {copied ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>

        <button
          onClick={shareLink}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition hover:opacity-90 shadow-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <Share2 size={18} />
          Share with Friends
        </button>
      </div>
    </div>
  );
};

export default ReferralSection;

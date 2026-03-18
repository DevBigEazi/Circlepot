"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useState } from "react";
import {
  Users,
  AlertCircle,
  Clock,
  Globe,
  Lock,
  Loader,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import { useCircleDetails } from "@/app/hooks/useBrowseCircles";
import { useCircleSavings } from "@/app/hooks/useCircleSavings";
import { formatUnits } from "viem";
import { toast } from "sonner";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useAccountAddress } from "@/app/hooks/useAccountAddress";
import { useQueryClient } from "@tanstack/react-query";
import { handleSmartAccountError } from "@/lib/error-handler";

export default function JoinCirclePage() {
  const params = useParams();
  const circleId = params?.circleId as string;
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address } = useAccountAddress();

  const { data: circle, isLoading, error } = useCircleDetails(circleId);
  const { joinCircle, isJoining, checkUserStatusSubgraph } = useCircleSavings();
  const [status, setStatus] = useState<{
    isInvited: boolean | null;
    isMember: boolean | null;
    loading: boolean;
  }>({
    isInvited: null,
    isMember: null,
    loading: false,
  });
  const [hasConsented, setHasConsented] = useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!circle || !address) {
        setStatus({ isInvited: null, isMember: null, loading: false });
        // Only reset if we actually have a reason to (e.g. circle loaded then address changed)
        return;
      }

      setStatus((prev) => ({ ...prev, loading: true }));
      try {
        const result = await checkUserStatusSubgraph(circle.circleId, address);

        setStatus({
          isMember: result.isMember,
          isInvited: circle.visibility === 0 ? result.isInvited : null,
          loading: false,
        });
      } catch (err) {
        console.error("Error checking status:", err);
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    checkStatus();
  }, [circle, address, checkUserStatusSubgraph]);

  const handleJoin = async () => {
    if (!circle || !address) {
      if (!address) {
        toast.error("Please sign in to your account first");
        return;
      }
      return;
    }

    try {
      await joinCircle(circle.circleId, circle.collateralAmount);
      toast.success("Joined circle successfully!");

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["userSavings"] });
        router.push("/savings?tab=group");
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error(handleSmartAccountError(err));
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background }}
      >
        <NavBar
          variant="minimal"
          title="Loading..."
          onBack={() => router.back()}
          colors={colors}
        />
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <LoadingSpinner />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
            Verifying invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.background }}
      >
        <NavBar
          variant="minimal"
          title="Not Found"
          onBack={() => router.back()}
          colors={colors}
        />
        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
          <div className="w-20 h-20 rounded-4xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2
              className="text-2xl font-black tracking-tight"
              style={{ color: colors.text }}
            >
              Circle Not Found
            </h2>
            <p
              className="text-sm opacity-50 font-medium"
              style={{ color: colors.text }}
            >
              This circle might have been closed, reached its destination, or
              the link is invalid.
            </p>
          </div>
          <button
            onClick={() => router.push("/browse")}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg"
          >
            Browse other circles
          </button>
        </div>
      </div>
    );
  }

  const contribution = formatUnits(BigInt(circle.contributionAmount || "0"), 6);
  const collateral = formatUnits(BigInt(circle.collateralAmount || "0"), 6);
  const isJoinable = Number(circle.state) === 1 || Number(circle.state) === 2;

  const getFrequencyLabel = (freq: number) => {
    switch (freq) {
      case 0:
        return "Daily";
      case 1:
        return "Weekly";
      case 2:
        return "Monthly";
      default:
        return "Periodic";
    }
  };

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Circle Invitation"
        onBack={() => router.push("/browse")}
        colors={colors}
      />

      <main className="max-w-2xl mx-auto px-2 sm:px-4 mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl sm:rounded-4xl mx-auto flex items-center justify-center shadow-2xl"
            style={{ backgroundColor: colors.primary }}
          >
            <Users className="text-white" size={28} />
          </div>
          <div className="space-y-1">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: colors.text }}
            >
              {circle.circleName}
            </h1>
            <div className="flex items-center justify-center pt-2">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                Organized by{" "}
                <span className="text-primary opacity-100">
                  {circle.creator.username || "Anonymous"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div
            className="p-4 sm:p-6 rounded-3xl sm:rounded-4xl border-2 space-y-1 text-center"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40">
              Contribution
            </p>
            <p
              className="text-xl sm:text-2xl font-black"
              style={{ color: colors.text }}
            >
              ${contribution}
            </p>
            <p className="text-[8px] sm:text-[10px] font-bold opacity-40">
              Every {getFrequencyLabel(Number(circle.frequency)).toLowerCase()}
            </p>
          </div>
          <div
            className="p-4 sm:p-6 rounded-3xl sm:rounded-4xl border-2 space-y-1 text-center"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider opacity-40">
              Collateral
            </p>
            <p
              className="text-xl sm:text-2xl font-black"
              style={{ color: colors.text }}
            >
              ${collateral}
            </p>
            <p className="text-[8px] sm:text-[10px] font-bold opacity-40">
              Security Deposit
            </p>
          </div>
        </div>

        {/* Circle Details card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-6 rounded-4xl border-2 space-y-6"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <h3 className="text-xs font-black uppercase tracking-widest opacity-30">
              Circle Intelligence
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-opacity-50 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.background }}
                >
                  <Clock size={16} className="opacity-40 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">
                    Frequency
                  </p>
                  <p className="text-sm font-bold">
                    {getFrequencyLabel(Number(circle.frequency))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-opacity-50 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: colors.background }}
                >
                  <Users size={16} className="opacity-40 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">
                    Members
                  </p>
                  <p className="text-sm font-bold">
                    {circle.currentMembers} / {circle.maxMembers} Joined
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-opacity-50 flex items-center justify-center font-black shrink-0"
                  style={{ backgroundColor: colors.background }}
                >
                  {Number(circle.visibility) === 1 ? (
                    <Globe size={20} className="text-emerald-500" />
                  ) : (
                    <Lock size={20} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">
                    Visibility
                  </p>
                  <p
                    className={`text-sm font-bold ${Number(circle.visibility) === 1 ? "text-emerald-500" : "text-amber-500"}`}
                  >
                    {Number(circle.visibility) === 1
                      ? "Public - Open"
                      : "Private - Invitation Only"}
                  </p>
                </div>
              </div>
            </div>

            {circle.circleDescription && (
              <div
                className="pt-6 border-t border-dashed"
                style={{ borderColor: colors.border }}
              >
                <p className="text-xs font-bold leading-relaxed opacity-60">
                  {circle.circleDescription}
                </p>
              </div>
            )}
          </div>

          <div
            className="p-6 rounded-4xl border-2 space-y-6"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-30">
                Payout Rules
              </h3>
              <PieChart size={18} className="opacity-30" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="opacity-50">Platform Fee</span>
                  <span className="text-primary">1% Tiered</span>
                </div>
                <p className="text-[11px] opacity-40 font-bold leading-relaxed">
                  A small fee is deducted from payouts for sustainability. 1%
                  for payouts ≤ $1000, fixed $10 for larger payouts.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-wider text-center">
                  Creator is always fee-exempt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="pt-4">
          {!address ? (
            <div
              className="p-5 sm:p-6 rounded-3xl sm:rounded-4xl border-2 border-dashed bg-primary/5 text-center flex flex-col gap-4"
              style={{ borderColor: "hsla(var(--primary) / 0.3)" }}
            >
              <p className="text-xs sm:text-sm font-bold opacity-60">
                Sign in to your account to participate
              </p>
              <button
                onClick={() =>
                  router.push(
                    `/auth?redirect=${encodeURIComponent(window.location.pathname)}`,
                  )
                }
                className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-primary/20 transition-transform active:scale-95"
              >
                Sign In to Join
              </button>
            </div>
          ) : !isJoinable ? (
            <div
              className="p-6 rounded-4xl border-2 border-dashed bg-red-500/5 text-center"
              style={{ borderColor: colors.border }}
            >
              <p className="text-sm font-black text-red-500 uppercase tracking-widest">
                Enrollment Closed
              </p>
              <p className="text-xs opacity-50 mt-1 font-bold">
                This circle is already active or has reached completion.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.isMember === true && !status.loading && (
                <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
                  <ShieldCheck
                    size={20}
                    className="text-blue-500 shrink-0 mt-0.5"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">
                      Active Member
                    </span>
                    <span className="text-xs font-bold text-blue-500/70 leading-relaxed">
                      You are already a participating member of this circle. You
                      can view your progress in the savings dashboard.
                    </span>
                  </div>
                </div>
              )}

              {status.isInvited === false &&
                !status.isMember &&
                !status.loading &&
                circle.visibility === 0 && (
                  <div className="p-4 rounded-3xl bg-red-500/5 border border-red-500/20 flex items-start gap-4">
                    <AlertCircle
                      size={20}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-red-500 uppercase tracking-widest">
                        Access Restricted
                      </span>
                      <span className="text-xs font-bold text-red-500/70 leading-relaxed">
                        This is a private circle. You must be invited by the
                        creator to participate in this savings round.
                      </span>
                    </div>
                  </div>
                )}

              {!status.loading &&
                !status.isMember &&
                (circle.visibility === 0 ? status.isInvited : true) && (
                  <label className="flex items-center gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10 hover:bg-primary/8 transition-all group cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={hasConsented}
                        onChange={(e) => setHasConsented(e.target.checked)}
                        className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div
                        className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${hasConsented ? "bg-primary border-primary" : "bg-transparent border-primary/30 group-hover:border-primary/50"}`}
                      >
                        {hasConsented && (
                          <ShieldCheck size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 select-none">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                        Agreement
                      </span>
                      <span className="text-[10px] font-bold opacity-60 leading-relaxed">
                        I understand the payment frequency and collateral terms.
                        I acknowledge that members can vote to start or withdraw
                        once 60% capacity is reached.
                      </span>
                    </div>
                  </label>
                )}

              <button
                onClick={handleJoin}
                disabled={
                  isJoining ||
                  status.loading ||
                  (circle.visibility === 0 && !status.isInvited) ||
                  status.isMember === true ||
                  !hasConsented
                }
                className="w-full py-5 rounded-4xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isJoining || status.loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />{" "}
                    {status.loading
                      ? "Verifying Access..."
                      : "Verifying Transaction..."}
                  </>
                ) : status.isMember === true ? (
                  <>
                    <ShieldCheck size={16} />
                    Already a Member
                  </>
                ) : circle.visibility === 0 && !status.isInvited ? (
                  <>
                    <Lock size={16} />
                    Invitation Required
                  </>
                ) : (
                  "Confirm & Join Circle"
                )}
              </button>
            </div>
          )}
          <p className="text-center text-[9px] mt-6 font-black uppercase tracking-[0.2em] opacity-30">
            Decentralized &bull; Transparent &bull; Secure
          </p>
        </div>
      </main>
    </div>
  );
}

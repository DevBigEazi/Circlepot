"use client";

import React from "react";
import {
  X,
  Loader,
  Users,
  DollarSign,
  ShieldCheck,
  PieChart,
  Lock,
  Globe,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Circle } from "../../types/savings";
import { formatUnits } from "viem";
import { useEffect, useState } from "react";
import { useCircleSavings } from "../../hooks/useCircleSavings";
import { useAccountAddress } from "../../hooks/useAccountAddress";

interface JoinCircleModalProps {
  isOpen: boolean;
  circle: Circle;
  isLoading: boolean;
  onClose: () => void;
  onJoin: () => void;
}

export const JoinCircleModal: React.FC<JoinCircleModalProps> = ({
  isOpen,
  circle,
  isLoading,
  onClose,
  onJoin,
}) => {
  const { address } = useAccountAddress();
  const { checkUserStatusSubgraph } = useCircleSavings();
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
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const checkStatus = async () => {
      if (!isOpen || !address) {
        setStatus({ isInvited: null, isMember: null, loading: false });
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
  }, [
    isOpen,
    circle.circleId,
    circle.visibility,
    address,
    checkUserStatusSubgraph,
  ]);

  // Reset step when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setHasConsented(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPrivate = circle.visibility === 0;
  const showInviteError =
    isPrivate && status.isInvited === false && !status.loading;
  const showMemberError = status.isMember === true && !status.loading;

  const contribution = formatUnits(BigInt(circle.contributionAmount || "0"), 6);
  const collateral = formatUnits(BigInt(circle.collateralAmount || "0"), 6);

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
    <>
      <div
        className="fixed inset-0 z-50 backdrop-blur-sm transition-opacity"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
          style={{ backgroundColor: "var(--surface)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 sm:p-6 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: "hsla(var(--primary) / 0.15)" }}
              >
                <Users size={20} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex flex-col">
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Join Circle
                </h2>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-light)" }}
                >
                  {currentStep === 1 ? "Overview" : "Protocols & Consent"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-70 transition"
              disabled={isLoading}
            >
              <X size={20} style={{ color: "var(--text-light)" }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                {isPrivate ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                    <Lock size={10} />
                    Private Circle
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                    <Globe size={10} />
                    Public Circle
                  </div>
                )}
              </div>
              <h3
                className="text-xl font-black tracking-tight"
                style={{ color: "var(--text)" }}
              >
                {circle.circleName}
              </h3>
              <p
                className="text-sm opacity-50 font-medium"
                style={{ color: "var(--text)" }}
              >
                {circle.circleDescription}
              </p>
            </div>

            {currentStep === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-2xl flex flex-col items-center text-center gap-1"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <DollarSign size={16} className="opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-40">
                      Contribution
                    </span>
                    <span
                      className="text-lg font-black"
                      style={{ color: "var(--text)" }}
                    >
                      ${contribution}
                    </span>
                    <span className="text-[8px] opacity-40 font-bold">
                      {getFrequencyLabel(circle.frequency)}
                    </span>
                  </div>
                  <div
                    className="p-4 rounded-2xl flex flex-col items-center text-center gap-1"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <ShieldCheck size={16} className="opacity-40" />
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-40">
                      Collateral
                    </span>
                    <span
                      className="text-lg font-black"
                      style={{ color: "var(--text)" }}
                    >
                      ${collateral}
                    </span>
                    <span className="text-[8px] opacity-40 font-bold">
                      101% Security
                    </span>
                  </div>
                </div>

                <div
                  className="p-4 rounded-2xl border border-primary/10 space-y-2"
                  style={{ backgroundColor: "hsla(var(--primary) / 0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Membership Spot
                    </span>
                  </div>
                  <p className="text-[11px] font-bold opacity-60 leading-relaxed">
                    This circle has{" "}
                    {Number(circle.maxMembers) - Number(circle.currentMembers)}{" "}
                    spots remaining. Review the protocols on the next step to
                    finalize your joining request.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">
                    Circle Protocols
                  </h4>
                  <div
                    className="p-4 rounded-2xl border-2 border-dashed space-y-4"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "hsla(var(--primary) / 0.02)",
                    }}
                  >
                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-primary" />
                        Participation Rules
                      </span>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Must contribute ${contribution} every{" "}
                          {getFrequencyLabel(circle.frequency).toLowerCase()}.
                        </li>
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Collateral of ${collateral} is locked and returned on
                          completion.
                        </li>
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Collective Voting: Once 60% capacity is reached,
                          members can vote to start the circle or withdraw.
                        </li>
                      </ul>
                    </div>
                    <div
                      className="h-px w-full border-t border-dashed"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <PieChart size={12} className="text-primary" />
                        Payout Terms
                      </span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="opacity-50">Platform Fee</span>
                          <span className="text-primary">1% Tiered</span>
                        </div>
                        <p className="text-[10px] opacity-40 font-bold leading-relaxed">
                          Small fee (1% up to $1000, fixed $10 above) supports
                          platform maintenance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-4 sm:p-6 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {showMemberError ? (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
                <ShieldCheck
                  size={16}
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">
                    Active Member
                  </span>
                  <span className="text-[10px] font-bold text-blue-500/70 leading-tight">
                    You are already a member.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {currentStep === 2 &&
                  !status.loading &&
                  !status.isMember &&
                  (isPrivate ? status.isInvited : true) && (
                    <label className="flex items-center gap-3 mb-6 cursor-pointer p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/8 transition-all group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={hasConsented}
                          onChange={(e) => setHasConsented(e.target.checked)}
                          className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${hasConsented ? "bg-primary border-primary" : "bg-transparent border-primary/30 group-hover:border-primary/50"}`}
                        >
                          {hasConsented && (
                            <ShieldCheck size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold opacity-70 leading-relaxed select-none">
                        I understand the{" "}
                        <span className="text-primary">
                          contribution frequency
                        </span>{" "}
                        and that my{" "}
                        <span className="text-primary font-black">
                          collateral
                        </span>{" "}
                        is at risk.
                      </span>
                    </label>
                  )}
                {showInviteError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle
                      size={16}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">
                        Access Denied
                      </span>
                      <span className="text-[10px] font-bold text-red-500/70 leading-tight">
                        Private circle. You must be invited.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              {currentStep === 2 && (
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center gap-2 border-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {currentStep === 1 ? (
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={
                    isLoading ||
                    status.loading ||
                    (isPrivate && !status.isInvited) ||
                    status.isMember === true
                  }
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed bg-primary text-white"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={onJoin}
                  disabled={
                    isLoading ||
                    status.loading ||
                    (isPrivate && !status.isInvited) ||
                    status.isMember === true ||
                    !hasConsented
                  }
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed bg-primary text-white"
                >
                  {isLoading || status.loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      {status.loading ? "Verifying..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Users size={16} />
                      {status.isMember === true
                        ? "Already a Member"
                        : "Join Circle"}
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-center text-[9px] mt-4 opacity-30 font-black uppercase tracking-widest">
              Smart Contract Managed &bull; No middleman
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

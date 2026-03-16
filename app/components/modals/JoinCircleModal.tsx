"use client";

import React from "react";
import {
  X,
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
import LoadingSpinner from "../LoadingSpinner";
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

  const contribution = Number(
    formatUnits(BigInt(circle.contributionAmount || "0"), 6),
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const collateral = Number(
    formatUnits(BigInt(circle.collateralAmount || "0"), 6),
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
          className="w-full sm:max-w-md bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 sm:p-8 border-b shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center translate-y-[-2px]"
                style={{ backgroundColor: "hsla(var(--primary) / 0.15)" }}
              >
                <Users size={20} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex flex-col">
                <h2
                  className="text-xl sm:text-2xl font-black tracking-tight"
                  style={{ color: "var(--text)" }}
                >
                  Join Circle
                </h2>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40"
                  style={{ color: "var(--text)" }}
                >
                  {currentStep === 1 ? "Overview" : "Protocols & Consent"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-black/5 transition-colors absolute right-6 sm:right-8 top-6 sm:top-8"
              disabled={isLoading}
            >
              <X size={20} style={{ color: "var(--text-light)" }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                {isPrivate ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-wider">
                    <Lock size={10} />
                    Private
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                    <Globe size={10} />
                    Public Circle
                  </div>
                )}
              </div>
              <h3
                className="text-2xl font-black tracking-tight leading-tight"
                style={{ color: "var(--text)" }}
              >
                {circle.circleName}
              </h3>
              <p
                className="text-xs sm:text-sm opacity-50 font-medium leading-relaxed"
                style={{ color: "var(--text)" }}
              >
                {circle.circleDescription}
              </p>
            </div>

            {currentStep === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-3xl flex flex-col items-center text-center gap-1"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <DollarSign size={14} className="opacity-40" />
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-40">
                      Contribution
                    </span>
                    <span
                      className="text-xl font-black"
                      style={{ color: "var(--text)" }}
                    >
                      ${contribution}
                    </span>
                    <span className="text-[9px] opacity-40 font-bold">
                      {getFrequencyLabel(circle.frequency)}
                    </span>
                  </div>
                  <div
                    className="p-4 rounded-3xl flex flex-col items-center text-center gap-1"
                    style={{ backgroundColor: "var(--background)" }}
                  >
                    <ShieldCheck size={14} className="opacity-40" />
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-40">
                      Collateral
                    </span>
                    <span
                      className="text-xl font-black"
                      style={{ color: "var(--text)" }}
                    >
                      ${collateral}
                    </span>
                    <span className="text-[9px] opacity-40 font-bold uppercase">
                      101% Collateral
                    </span>
                  </div>
                </div>

                <div
                  className="p-5 rounded-3xl border border-primary/10 space-y-2"
                  style={{ backgroundColor: "hsla(var(--primary) / 0.03)" }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                      Membership Status
                    </span>
                  </div>
                  <p className="text-[11px] font-bold opacity-60 leading-relaxed">
                    This circle has{" "}
                    <span className="text-primary">
                      {Number(circle.maxMembers) - Number(circle.currentMembers)}
                    </span>{" "}
                    spots remaining. Proceed to review terms.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">
                    Circle Protocols
                  </h3>
                  <div
                    className="p-6 rounded-4xl border-2 border-dashed space-y-4"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "hsla(var(--primary) / 0.02)",
                    }}
                  >
                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-primary" />
                        Membership Rules
                      </span>
                      <ul className="space-y-2.5">
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Contribute ${contribution} every{" "}
                          {getFrequencyLabel(circle.frequency).toLowerCase()}
                        </li>
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Collateral of ${collateral} is auto-returned on finish
                        </li>
                        <li className="flex items-start gap-3 text-[11px] font-bold leading-relaxed opacity-70">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                          Voting power active once 60% capacity reached
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
                        Smart Payouts
                      </span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="opacity-50">Handling Fee</span>
                          <span className="text-primary">1% Tiered</span>
                        </div>
                        <p className="text-[10px] opacity-40 font-bold leading-relaxed">
                          Covers platform maintenance and node processing costs.
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
            className="p-6 sm:p-8 border-t shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            {showMemberError ? (
              <div className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                    Active Member
                  </span>
                  <span className="text-[11px] font-bold text-blue-500/70 leading-snug">
                    You are already participating in this circle.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {currentStep === 2 &&
                  !status.loading &&
                  !status.isMember &&
                  (isPrivate ? status.isInvited : true) && (
                    <label className="flex items-center gap-4 mb-6 cursor-pointer p-4 rounded-3xl bg-primary/5 border border-primary/10 hover:bg-primary/8 transition-all group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={hasConsented}
                          onChange={(e) => setHasConsented(e.target.checked)}
                          className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div
                          className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${hasConsented ? "bg-primary border-primary" : "bg-transparent border-primary/30 group-hover:border-primary/50"}`}
                        >
                          {hasConsented && (
                            <ShieldCheck size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold opacity-60 leading-relaxed select-none">
                        I agree to terms and understand the risks.
                      </span>
                    </label>
                  )}
                {showInviteError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-start gap-3">
                    <AlertCircle
                      size={18}
                      className="text-red-500 shrink-0 mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Invitation Required
                      </span>
                      <span className="text-[11px] font-bold text-red-500/70 leading-snug">
                        This is a private circle. Access denied.
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
                  className="px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition flex items-center justify-center gap-2 border-2 border-primary/20 text-primary hover:bg-primary/5"
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
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed bg-primary text-white"
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
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed bg-primary text-white"
                >
                  {isLoading || status.loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      {status.loading ? "Verifying..." : "Joining..."}
                    </>
                  ) : (
                    <>
                      <Users size={16} />
                      {status.isMember === true
                        ? "Already Joined"
                        : "Confirm Join"}
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-center text-[8px] mt-6 opacity-30 font-black uppercase tracking-widest">
              Blockchain Secured &bull; Avalanche Network
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

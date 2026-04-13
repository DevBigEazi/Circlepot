"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  AlertTriangle,
  Lock,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { usePersonalGoals } from "@/app/hooks/usePersonalGoals";
import { useYieldAPY } from "@/app/hooks/useYieldAPY";
import { toast } from "sonner";
import { handleSmartAccountError } from "@/lib/error-handler";
import confetti from "canvas-confetti";

export default function CreatePersonalGoalPage() {
  const router = useRouter();
  const colors = useThemeColors();
  const { createPersonalGoal, checkVaultAddress, isCreating } =
    usePersonalGoals();
  const { apy, isLoading: isLoadingAPY } = useYieldAPY();

  const [step, setStep] = useState<number>(1);
  const [isYieldAvailable, setIsYieldAvailable] = useState(false);
  const [isCheckingVault, setIsCheckingVault] = useState(true);

  // Form State
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    contributionAmount: "",
    frequency: 1, // 0: Daily, 1: Weekly, 2: Monthly
    enableYield: false,
    hasAcceptedRisk: false,
  });

  const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT || "";

  useEffect(() => {
    async function checkVault() {
      if (USDT_ADDRESS) {
        const vault = await checkVaultAddress(USDT_ADDRESS);
        setIsYieldAvailable(
          vault !== "0x0000000000000000000000000000000000000000",
        );
        setIsCheckingVault(false);
      }
    }
    checkVault();
  }, [USDT_ADDRESS, checkVaultAddress]);

  // Calculate Deadline
  const deadlineDate = useMemo(() => {
    if (!form.targetAmount || !form.contributionAmount) return null;
    const target = parseFloat(form.targetAmount);
    const contribution = parseFloat(form.contributionAmount);
    if (isNaN(target) || isNaN(contribution) || contribution <= 0) return null;

    const periods = Math.ceil(target / contribution);
    const date = new Date();

    if (form.frequency === 0) date.setDate(date.getDate() + periods);
    else if (form.frequency === 1) date.setDate(date.getDate() + periods * 7);
    else if (form.frequency === 2) date.setMonth(date.getMonth() + periods);

    return date;
  }, [form.targetAmount, form.contributionAmount, form.frequency]);

  const handleCreate = async () => {
    if (form.enableYield && !form.hasAcceptedRisk) {
      toast.error("Please accept the yield risks to continue");
      return;
    }

    try {
      const params = {
        name: form.name,
        targetAmount: form.targetAmount,
        contributionAmount: form.contributionAmount,
        frequency: form.frequency,
        deadline: deadlineDate ? Math.floor(deadlineDate.getTime() / 1000) : 0,
        enableYield: form.enableYield,
        yieldAPY: Math.floor(apy * 100), // Convert to BPS (e.g. 5.2% -> 520)
      };

      await createPersonalGoal(params);

      // Success effects
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [colors.primary, colors.secondary, "#ffffff"],
      });

      toast.success("🎯 Goal created successfully!");

      // Delay navigation
      setTimeout(() => {
        router.push("/savings");
      }, 1500);
    } catch (e) {
      toast.error(handleSmartAccountError(e));
    }
  };

  const isFormValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      parseFloat(form.targetAmount) >= 10 &&
      parseFloat(form.contributionAmount) > 0 &&
      (!form.enableYield || form.hasAcceptedRisk)
    );
  }, [form]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Create Personal Goal"
        subtitle="Set up your savings journey"
        onBack={() => (step === 1 ? router.back() : setStep(1))}
        colors={colors}
      />

      <main className="max-w-2xl mx-auto px-4 py-8 pb-12">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                style={{
                  backgroundColor: step >= s ? colors.primary : colors.surface,
                  color: step >= s ? "#fff" : colors.text,
                  border: `2px solid ${step >= s ? colors.primary : colors.border}`,
                }}
              >
                {step > s ? <CheckCircle size={18} /> : s}
              </div>
              {s < 2 && (
                <div
                  className="w-12 h-1 rounded-full"
                  style={{
                    backgroundColor: step > s ? colors.primary : colors.border,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Goal Info Card */}
            <div
              className="p-6 rounded-3xl border shadow-sm space-y-4"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div>
                <label
                  className="block text-sm font-bold mb-2 ml-1"
                  style={{ color: colors.text }}
                >
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Trip, New Laptop"
                  className="w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 outline-none transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-bold mb-2 ml-1"
                    style={{ color: colors.text }}
                  >
                    Target (USDT)
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 outline-none transition-all"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    value={form.targetAmount}
                    onChange={(e) =>
                      setForm({ ...form, targetAmount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-bold mb-2 ml-1"
                    style={{ color: colors.text }}
                  >
                    Contribution
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    className="w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 outline-none transition-all"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    }}
                    value={form.contributionAmount}
                    onChange={(e) =>
                      setForm({ ...form, contributionAmount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-bold mb-2 ml-1"
                  style={{ color: colors.text }}
                >
                  Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 0, label: "Daily" },
                    { id: 1, label: "Weekly" },
                    { id: 2, label: "Monthly" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setForm({ ...form, frequency: f.id })}
                      className="py-2.5 rounded-xl border-2 font-bold text-xs transition-all"
                      style={{
                        backgroundColor:
                          form.frequency === f.id
                            ? `${colors.primary}15`
                            : colors.background,
                        borderColor:
                          form.frequency === f.id
                            ? colors.primary
                            : colors.border,
                        color:
                          form.frequency === f.id
                            ? colors.primary
                            : colors.text,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {deadlineDate && (
              <div
                className="p-5 rounded-2xl border shadow-subtle flex items-center justify-between"
                style={{
                  backgroundColor: `${colors.primary}10`,
                  borderColor: `${colors.primary}20`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm">
                    <TrendingUp size={20} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold opacity-60"
                      style={{ color: colors.text }}
                    >
                      ESTIMATED COMPLETION
                    </div>
                    <div
                      className="text-base font-bold"
                      style={{ color: colors.text }}
                    >
                      {deadlineDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              disabled={!isFormValid}
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: colors.primary, color: "#fff" }}
            >
              Continue <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Yield Option Card */}
            <div
              className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 ${
                isYieldAvailable
                  ? "cursor-default"
                  : "opacity-60 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: colors.surface,
                borderColor: form.enableYield ? colors.primary : colors.border,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-3 rounded-2xl shrink-0"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <TrendingUp size={22} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-sm sm:text-base leading-tight"
                      style={{ color: colors.text }}
                    >
                      Enable Yield Savings
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isCheckingVault ? (
                        <div className="flex items-center gap-1">
                          <Loader2 size={10} className="animate-spin" />
                          <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                            Checking Vault...
                          </span>
                        </div>
                      ) : isYieldAvailable ? (
                        <>
                          <span
                            className="text-xs font-bold"
                            style={{ color: colors.primary }}
                          >
                            {isLoadingAPY ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              `${apy.toFixed(2)}% APY`
                            )}
                          </span>
                          <span
                            className="text-[10px] opacity-40 font-bold uppercase tracking-tighter"
                            style={{ color: colors.text }}
                          >
                            EIP-4626 Power
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertTriangle size={10} />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">
                            Not Available for USDT
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explicit Toggle Component */}
                <div className="relative">
                  <button
                    id="yield-toggle"
                    disabled={!isYieldAvailable || isCheckingVault}
                    onClick={() =>
                      setForm({ ...form, enableYield: !form.enableYield })
                    }
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${
                      !isYieldAvailable || isCheckingVault
                        ? "opacity-50 grayscale cursor-not-allowed"
                        : "cursor-pointer active:scale-95"
                    }`}
                    style={{
                      backgroundColor: form.enableYield
                        ? colors.primary
                        : colors.border,
                    }}
                    aria-label="Toggle yield savings"
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-500 ease-in-out flex items-center justify-center ${
                        form.enableYield ? "left-8" : "left-1"
                      }`}
                    >
                      {form.enableYield && (
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {!isYieldAvailable && !isCheckingVault && (
                <p
                  className="mt-4 text-[10px] font-medium opacity-50 italic"
                  style={{ color: colors.text }}
                >
                  Yield generation is not currently enabled for USDT on the
                  smart contract. Standard savings will apply.
                </p>
              )}

              {form.enableYield && (
                <div
                  className="p-4 rounded-2xl space-y-3 mt-4 animate-in fade-in zoom-in-95"
                  style={{
                    backgroundColor: colors.warningBg + "30",
                    border: `1px solid ${colors.warningBorder}30`,
                  }}
                >
                  <div className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: colors.text }}
                    >
                      Your funds will be deposited into a money market (AAVE V3
                      via EIP-4626). While this earns yield, it carries smart
                      contract risk.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasAcceptedRisk}
                      onChange={(e) =>
                        setForm({ ...form, hasAcceptedRisk: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: colors.text }}
                    >
                      I understand and accept the risks
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Withdrawal Fees Info Card */}
            <div
              className="p-6 rounded-3xl border shadow-sm"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-3 rounded-2xl"
                  style={{ backgroundColor: `${colors.secondary}15` }}
                >
                  <Lock size={22} style={{ color: colors.secondary }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-sm sm:text-base"
                    style={{ color: colors.text }}
                  >
                    Fees & Early Withdrawals
                  </h3>
                  <p
                    className="text-[10px] opacity-60 font-medium"
                    style={{ color: colors.text }}
                  >
                    BASED ON GOAL COMPLETION PROGRESS
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  {
                    range: "0% - 24%",
                    label: "Early Withdrawal Fee",
                    fee: "1.0%",
                  },
                  {
                    range: "25% - 49%",
                    label: "Early Withdrawal Fee",
                    fee: "0.6%",
                  },
                  {
                    range: "50% - 74%",
                    label: "Early Withdrawal Fee",
                    fee: "0.3%",
                  },
                  {
                    range: "75% - 99%",
                    label: "Early Withdrawal Fee",
                    fee: "0.25%",
                  },
                  {
                    range: "100%",
                    label: "Completion Fee",
                    fee: "0.1%",
                    success: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-1"
                  >
                    <div className="flex flex-col">
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: colors.textLight }}
                      >
                        {item.range} Progress
                      </span>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: colors.text }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: item.success ? colors.primary : colors.text,
                      }}
                    >
                      {item.fee}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={isCreating}
                onClick={() => setStep(1)}
                className="flex-[0.3] py-4 rounded-3xl font-bold border-2 transition-all hover:bg-black/5 flex items-center justify-center gap-2"
                style={{ borderColor: colors.border, color: colors.text }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                disabled={isCreating}
                onClick={handleCreate}
                className="flex-1 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-lg relative overflow-hidden"
                style={{ backgroundColor: colors.primary, color: "#fff" }}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    Launch Goal <CheckCircle size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Info Modal Trigger (Floating) */}
      <div className="fixed bottom-6 right-6">
        <button
          className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.primary,
          }}
        >
          <Info size={24} />
        </button>
      </div>
    </div>
  );
}

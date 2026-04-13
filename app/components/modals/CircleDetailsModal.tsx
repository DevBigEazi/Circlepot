/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import {
  X,
  Users,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { ActiveCircle } from "../../types/savings";
import { ThemeColors } from "../../hooks/useThemeColors";
import { getFrequencyText } from "../../lib/circleUtils";

interface CircleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: ActiveCircle;
  colors: ThemeColors;
}

export const CircleDetailsModal: React.FC<CircleDetailsModalProps> = ({
  isOpen,
  onClose,
  circle,
  colors,
}) => {
  const tabs = ["Overview", "Members", "History"];
  const [activeTab, setActiveTab] = React.useState("Overview");

  if (!isOpen) return null;

  const { name, contribution, frequency, status, membersList, rawCircle } =
    circle;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-x-4 border-t-4 sm:border-4 animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div
          className="p-5 sm:p-8 border-b relative"
          style={{ borderColor: `${colors.border}40` }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 sm:right-8 top-4 sm:top-8 p-2 rounded-xl hover:bg-black/5 transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2 pr-10 sm:pr-12">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: colors.background,
                color: colors.primary,
              }}
            >
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-lg sm:text-2xl font-black tracking-tight truncate"
                style={{ color: colors.text }}
              >
                {name}
              </h2>
              <p className="text-[9px] sm:text-xs font-bold opacity-40 uppercase tracking-widest truncate">
                ID: {circle.id.slice(0, 10)}... • {status}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex px-4 sm:px-8 pt-4 gap-4 sm:gap-8 border-b"
          style={{ borderColor: `${colors.border}20` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="pb-3 sm:pb-4 text-[10px] sm:text-xs font-black uppercase tracking-widest relative transition-all"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.3,
              }}
            >
              {tab}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-8 max-h-[60vh] overflow-y-auto">
          {activeTab === "Overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/5 space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">
                    Contribution
                  </span>
                  <div
                    className="text-lg sm:text-xl font-black truncate"
                    style={{ color: colors.text }}
                  >
                    ${contribution}
                  </div>
                </div>
                <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/5 space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-40">
                    Frequency
                  </span>
                  <div
                    className="text-lg sm:text-xl font-black truncate"
                    style={{ color: colors.text }}
                  >
                    {getFrequencyText(frequency)}
                  </div>
                </div>
              </div>

              {/* Collateral Details */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-600/60">
                    Collateral Locked
                  </span>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 truncate">
                    ${circle.collateralLocked}
                  </div>
                </div>
                <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-600/60">
                    Collateral Required
                  </span>
                  <div className="text-lg sm:text-xl font-black text-blue-600 truncate">
                    ${circle.collateralRequired}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Description
                </h4>
                <p className="text-sm font-medium leading-relaxed opacity-60">
                  {rawCircle.circleDescription || "No description provided."}
                </p>
              </div>

              <div
                className="p-6 rounded-3xl border-2 border-dashed space-y-4"
                style={{ borderColor: colors.border }}
              >
                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <ShieldCheck size={14} /> Circle Rules
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle2 size={14} className="text-emerald-500" />{" "}
                    Fixed contribution amount: ${contribution}
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle2 size={14} className="text-emerald-500" />{" "}
                    Grace period: {frequency === 0 ? "12 hours" : "48 hours"}
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle2 size={14} className="text-emerald-500" /> Late
                    fee apply after due date
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold">
                    <AlertTriangle size={14} className="text-rose-500" />{" "}
                    Forfeiture: Late members can be forfeited after grace period
                    expires
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold">
                    <AlertTriangle size={14} className="text-rose-500" />{" "}
                    Penalty: Forfeited members lose contribution + late fee from
                    collateral
                  </li>
                  <li className="text-[10px] font-medium opacity-50 pl-7 leading-relaxed">
                    Note: Forfeiture only covers the missed contribution. The
                    member remains active in the circle for all future rounds.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "Members" && (
            <div className="space-y-4">
              {/* Member Status Legend */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 px-1 pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0"
                    title="Contributed"
                  >
                    C
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Contributed (Current Round)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm shrink-0"
                    title="Payout Received"
                  >
                    P
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Payout Received
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {membersList.map((member) => {
                  const isEmpty = member.id.startsWith("empty");
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isEmpty ? "opacity-40 grayscale" : ""}`}
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-xs font-black overflow-hidden relative">
                          {isEmpty ? (
                            member.position
                          ) : member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.fullName.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div
                            className="text-sm font-black flex flex-wrap gap-x-1"
                            style={{ color: colors.text }}
                          >
                            {member.fullName === "You" ? (
                              "You"
                            ) : member.fullName &&
                              member.fullName.includes(" ") ? (
                              <>
                                <span>{member.fullName.split(" ")[0]}</span>
                                <span className="hidden sm:inline">
                                  {member.fullName
                                    .split(" ")
                                    .slice(1)
                                    .join(" ")}
                                </span>
                              </>
                            ) : (
                              member.fullName
                            )}
                          </div>
                          <div className="text-[10px] font-bold opacity-30 truncate max-w-[150px]">
                            {isEmpty
                              ? "Waiting for member"
                              : "Active"}
                          </div>
                        </div>
                      </div>
                      {!isEmpty && (
                        <div className="flex items-center gap-2">
                          {member.hasContributed && (
                            <div
                              className="text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                              title="Contributed"
                            >
                              C
                            </div>
                          )}
                          {member.hasReceivedPayout && (
                            <div
                              className="text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm"
                              title="Payout Received"
                            >
                              P
                            </div>
                          )}
                          <div className="text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full bg-primary/10 text-primary">
                            Pos {member.position}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "History" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-3xl bg-black/5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${colors.secondary}15`,
                    color: colors.secondary,
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-40">
                    Payout History
                  </h3>
                  <div
                    className="text-sm font-black"
                    style={{ color: colors.text }}
                  >
                    {circle.payouts?.length || 0} of {circle.totalPositions}{" "}
                    Rounds Completed
                  </div>
                </div>
              </div>

              {!circle.payouts || circle.payouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-30 space-y-4">
                  <History size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center">
                    No payouts recorded yet.
                    <br />
                    History will appear once rounds complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {circle.payouts.map((payout, idx) => (
                    <div
                      key={payout.id || idx}
                      className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                          style={{ backgroundColor: colors.primary }}
                        >
                          #{payout.round}
                        </div>
                        <div>
                          <div
                            className="text-sm font-black"
                            style={{ color: colors.text }}
                          >
                            {payout.user.fullName}
                          </div>
                          <div className="text-[10px] font-bold opacity-30">
                            {new Date(
                              Number(payout.timestamp) * 1000,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-500">
                          +${payout.payoutAmount}
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-30">
                          Distributed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

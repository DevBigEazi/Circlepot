"use client";

import React from "react";
import { Transaction } from "../types/transaction";
import { useThemeColors } from "../hooks/useThemeColors";
import { Send, Download, Target, Wallet, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface TransactionItemProps {
  transaction: Transaction;
  onClick: (transaction: Transaction) => void;
}

// ---------- Helpers ----------

function getIcon(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return <Target size={18} />;
    case "goal_withdrawal":
      return <Wallet size={18} />;
    case "goal_completion":
      return <CheckCircle2 size={18} />;
    default:
      return isIncoming ? <Download size={18} /> : <Send size={18} />;
  }
}

function getIconClasses(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400";
    case "goal_withdrawal":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400";
    case "goal_completion":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400";
    default:
      return isIncoming
        ? "bg-green-100 text-green-600"
        : "bg-red-100 text-red-600";
  }
}

function getLabel(tx: Transaction) {
  const goalName = tx.metadata?.goalName || tx.displayName;
  switch (tx.type) {
    case "goal_contribution":
      return { prefix: "Saved to ", highlight: goalName || "Goal" };
    case "goal_withdrawal":
      return { prefix: "Withdrew from ", highlight: goalName || "Goal" };
    case "goal_completion":
      return { prefix: "Completed ", highlight: goalName || "Goal" };
    default: {
      const isInternal = tx.displayName?.startsWith("@");
      if (isInternal) {
        return {
          prefix: tx.isIncoming ? "Received from " : "Sent to ",
          highlight: tx.displayName!,
        };
      }
      return { prefix: tx.isIncoming ? "Received" : "Sent", highlight: "" };
    }
  }
}

function getAmountColor(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "text-indigo-600 dark:text-indigo-400";
    case "goal_withdrawal":
      return "text-amber-600 dark:text-amber-400";
    case "goal_completion":
      return "text-emerald-600 dark:text-emerald-400";
    default:
      return isIncoming ? "text-green-600" : "text-red-600";
  }
}

function getAmountSign(type: Transaction["type"], isIncoming: boolean) {
  switch (type) {
    case "goal_contribution":
      return "-";
    case "goal_withdrawal":
    case "goal_completion":
      return "+";
    default:
      return isIncoming ? "+" : "-";
  }
}

// ---------- Component ----------

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
}) => {
  const colors = useThemeColors();
  const label = getLabel(transaction);
  const isSavingsType =
    transaction.type === "goal_contribution" ||
    transaction.type === "goal_withdrawal" ||
    transaction.type === "goal_completion";

  return (
    <button
      onClick={() => onClick(transaction)}
      className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] border border-transparent hover:border-black/5 dark:hover:border-white/5"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
            transaction.displayPhoto && !isSavingsType
              ? "bg-gray-100 dark:bg-gray-800"
              : ""
          }`}
        >
          {transaction.displayPhoto && !isSavingsType ? (
            <Image
              src={transaction.displayPhoto}
              alt={transaction.displayName || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full rounded-full flex items-center justify-center ${getIconClasses(transaction.type, transaction.isIncoming)}`}
            >
              {getIcon(transaction.type, transaction.isIncoming)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-1">
          <span
            className="text-sm font-bold truncate max-w-[140px] sm:max-w-full"
            style={{ color: colors.text }}
          >
            {label.prefix}
            {label.highlight && (
              <span style={{ color: colors.primary }}>{label.highlight}</span>
            )}
          </span>
          <span
            className="text-[11px] opacity-60 font-medium"
            style={{ color: colors.text }}
          >
            {formatDistanceToNow(transaction.timestamp * 1000, {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className={`text-sm font-black ${getAmountColor(transaction.type, transaction.isIncoming)}`}
        >
          {getAmountSign(transaction.type, transaction.isIncoming)}$
          {Number(transaction.amount).toFixed(2)}
        </span>
        <span
          className="text-[10px] font-bold opacity-40 uppercase tracking-widest"
          style={{ color: colors.text }}
        >
          {transaction.currency}
        </span>
      </div>
    </button>
  );
};

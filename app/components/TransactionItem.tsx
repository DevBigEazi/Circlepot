"use client";

import React from "react";
import { Transaction } from "../types/transaction";
import { useThemeColors } from "../hooks/useThemeColors";
import { Send, Download } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface TransactionItemProps {
  transaction: Transaction;
  onClick: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
}) => {
  const colors = useThemeColors();
  const isInternal = transaction.displayName?.startsWith("@");

  return (
    <button
      onClick={() => onClick(transaction)}
      className="w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] border border-transparent hover:border-black/5 dark:hover:border-white/5"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${
            transaction.displayPhoto ? "bg-gray-100 dark:bg-gray-800" : ""
          }`}
        >
          {transaction.displayPhoto ? (
            <Image
              src={transaction.displayPhoto}
              alt={transaction.displayName || ""}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={`w-full h-full rounded-full flex items-center justify-center ${
                transaction.isIncoming
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {transaction.isIncoming ? (
                <Download size={18} />
              ) : (
                <Send size={18} />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-1">
          <span
            className="text-sm font-bold truncate max-w-[140px] sm:max-w-full"
            style={{ color: colors.text }}
          >
            {transaction.isIncoming ? "Received" : "Sent"}
            {isInternal && (
              <span style={{ color: colors.primary }}>
                {transaction.isIncoming ? " from " : " to "}
                {transaction.displayName}
              </span>
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
          className={`text-sm font-black ${transaction.isIncoming ? "text-green-600" : "text-red-600"}`}
        >
          {transaction.isIncoming ? "+" : "-"}$
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

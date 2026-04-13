"use client";

import { useState, Fragment } from "react";
import { Transaction } from "../types/transaction";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useThemeColors } from "../hooks/useThemeColors";
import { TransactionItem } from "./TransactionItem";
import { TransactionDetailModal } from "./modals/TransactionDetailModal";
import { useRouter } from "next/navigation";
import { History, ArrowRight, Loader2 } from "lucide-react";

interface RecentTransactionsProps {
  limit?: number;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  limit = 5,
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const { transactions, isLoading } = useActivityFeed(limit);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <History size={18} style={{ color: colors.primary }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            Activity Feed
          </h2>
        </div>

        {!isLoading && transactions.length >= limit && (
          <button
            onClick={() => router.push("/transactions-history")}
            className="flex items-center gap-1.5 text-xs font-bold leading-none py-2 px-3 rounded-lg border transition hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: colors.primary, borderColor: colors.border }}
          >
            VIEW ALL <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div
        className="rounded-3xl border shadow-sm overflow-hidden p-2"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-60">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm font-medium" style={{ color: colors.text }}>
              Fetching transactions...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center opacity-60">
            <History
              size={32}
              className="mb-4 opacity-30"
              style={{ color: colors.text }}
            />
            <p
              className="text-sm font-bold mb-2"
              style={{ color: colors.text }}
            >
              No activity yet
            </p>
            <p
              className="text-xs font-medium max-w-[200px]"
              style={{ color: colors.textLight }}
            >
              Your recent transfers will show up here as soon as you start
              moving funds.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {transactions.map((tx: Transaction, idx: number) => (
              <Fragment key={tx.id}>
                <TransactionItem transaction={tx} onClick={setSelectedTx} />
                {idx < transactions.length - 1 && (
                  <div
                    className="mx-4 h-px border-t opacity-5"
                    style={{ borderColor: colors.text }}
                  />
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};

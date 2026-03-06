"use client";

import { useState, Fragment } from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";
import { useActivityFeed } from "@/app/hooks/useActivityFeed";
import { TransactionItem } from "@/app/components/TransactionItem";
import { TransactionDetailModal } from "@/app/components/TransactionDetailModal";
import { Transaction } from "@/app/types/transaction";
import { History, Loader2 } from "lucide-react";

export default function TransactionsHistoryPage() {
  const colors = useThemeColors();
  const router = useRouter();
  const { transactions, isLoading } = useActivityFeed();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Transaction History"
        onBack={() => router.back()}
        colors={colors}
      />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-bold" style={{ color: colors.text }}>
              Loading history...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-60">
            <History
              size={48}
              className="mb-4 opacity-20"
              style={{ color: colors.text }}
            />
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: colors.text }}
            >
              No Activity Yet
            </h3>
            <p className="text-sm max-w-xs" style={{ color: colors.textLight }}>
              When you send or receive USDT, your full transaction history will
              be listed here.
            </p>
          </div>
        ) : (
          <div
            className="rounded-[32px] border shadow-sm overflow-hidden p-2"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
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
          </div>
        )}
      </main>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

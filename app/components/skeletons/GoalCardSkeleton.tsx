"use client";

import { Skeleton } from "../ui/Skeleton";

export const GoalCardSkeleton = () => {
  return (
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border bg-surface/50 border-border/50">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32 opacity-50" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 opacity-40" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        <div className="flex gap-3 pt-4 border-t border-border/20">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

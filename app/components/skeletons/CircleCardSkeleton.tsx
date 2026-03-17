"use client";

import { Skeleton } from "../ui/Skeleton";

export const CircleCardSkeleton = () => {
  return (
    <div className="rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-6 border bg-surface/50 border-border/50">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full opacity-50" />
          </div>
          <Skeleton className="h-7 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-24 opacity-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl shrink-0" />
      </div>

      <Skeleton className="h-14 w-full rounded-2xl mb-6 opacity-30" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-2xl bg-background/40">
            <Skeleton className="h-2 w-10 mb-2 opacity-30" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 px-1">
        <Skeleton className="h-3 w-24 opacity-40" />
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-6 rounded-full border-2 border-surface" />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-border/20 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32 opacity-40" />
          <Skeleton className="h-4 w-20 rounded-lg opacity-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

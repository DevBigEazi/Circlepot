"use client";

import { Skeleton } from "../ui/Skeleton";

export const StatsSkeleton = () => {
  return (
    <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border flex flex-col justify-between shrink-0 w-[85%] sm:w-[300px] min-h-[120px] sm:min-h-[140px] bg-surface/50 border-border/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-24 opacity-50" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
};

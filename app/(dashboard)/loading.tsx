"use client";

import { StatsSkeleton } from "../components/skeletons/StatsSkeleton";
import { GoalCardSkeleton } from "../components/skeletons/GoalCardSkeleton";
import { CircleCardSkeleton } from "../components/skeletons/CircleCardSkeleton";
import { Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container py-6 sm:py-10 space-y-8 animate-in fade-in duration-500">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24 opacity-40" />
        <Skeleton className="h-10 w-48 sm:w-64" />
      </div>

      {/* Stats Row */}
      <StatsSkeleton />

      {/* Tab/Filter Skeleton */}
      <div className="flex gap-2 p-1 bg-surface/50 rounded-2xl w-fit border border-border/50">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl opacity-50" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <GoalCardSkeleton />
        <CircleCardSkeleton />
        <GoalCardSkeleton />
        <CircleCardSkeleton />
      </div>
    </div>
  );
}

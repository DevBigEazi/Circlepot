"use client";

import React, { useState, useMemo } from "react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import NavBar from "@/app/components/NavBar";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  Lock,
  Filter,
  ArrowRight,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { useBrowseCircles } from "@/app/hooks/useBrowseCircles";
import { useCircleSavings } from "@/app/hooks/useCircleSavings";
import { JoinCircleModal } from "@/app/components/modals/JoinCircleModal";
import { Circle } from "@/app/types/savings";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useSavings } from "@/app/components/SavingsProvider";

export default function BrowsePage() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: circles = [], isLoading } = useBrowseCircles();
  const { joinCircle, isJoining } = useCircleSavings();
  const { circles: userCircles } = useSavings();

  const joinedCircleIds = useMemo(() => {
    return new Set(userCircles.map((c) => c.rawCircle.circleId.toString()));
  }, [userCircles]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "public" | "private" | "daily" | "weekly" | "monthly"
  >("all");
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Range filters
  const [minContribution, setMinContribution] = useState<string>("");
  const [maxContribution, setMaxContribution] = useState<string>("");
  const [minCollateral, setMinCollateral] = useState<string>("");
  const [maxCollateral, setMaxCollateral] = useState<string>("");

  const filteredCircles = useMemo(() => {
    return circles.filter((circle) => {
      // Show only Created (1) and Voting (2) states
      const isJoinable = circle.state === 1 || circle.state === 2;
      if (!isJoinable) return false;

      // Don't show circles user has already joined
      if (joinedCircleIds.has(circle.circleId.toString())) {
        return false;
      }

      const contributionNum = Number(
        formatUnits(BigInt(circle.contributionAmount || "0"), 6),
      );
      const collateralNum = Number(
        formatUnits(BigInt(circle.collateralAmount || "0"), 6),
      );

      const matchesSearch =
        circle.circleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circle.circleDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "public" && Number(circle.visibility) === 1) ||
        (activeFilter === "private" && Number(circle.visibility) === 0) ||
        (activeFilter === "daily" && Number(circle.frequency) === 0) ||
        (activeFilter === "weekly" && Number(circle.frequency) === 1) ||
        (activeFilter === "monthly" && Number(circle.frequency) === 2);

      const matchesContribution =
        (!minContribution || contributionNum >= Number(minContribution)) &&
        (!maxContribution || contributionNum <= Number(maxContribution));

      const matchesCollateral =
        (!minCollateral || collateralNum >= Number(minCollateral)) &&
        (!maxCollateral || collateralNum <= Number(maxCollateral));

      return (
        matchesSearch &&
        matchesFilter &&
        matchesContribution &&
        matchesCollateral
      );
    });
  }, [
    circles,
    searchQuery,
    activeFilter,
    minContribution,
    maxContribution,
    minCollateral,
    maxCollateral,
    joinedCircleIds,
  ]);

  const handleJoin = async () => {
    if (!selectedCircle) return;

    try {
      await joinCircle(
        selectedCircle.circleId,
        selectedCircle.collateralAmount,
      );
      toast.success("Joined circle successfully!");
      setSelectedCircle(null);

      // Sync data after transaction
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["browse-circles"] });
        queryClient.invalidateQueries({ queryKey: ["userSavings"] });
        router.push("/savings");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to join circle",
      );
    }
  };

  const filters = [
    { id: "all", label: "All" },
    {
      id: "public",
      label: "Public",
      icon: Globe,
      description: "Open to everyone. Anyone can discover and join publicly.",
    },
    {
      id: "private",
      label: "Private",
      icon: Lock,
      description:
        "Exclusive access. Restricted to users with invitation links.",
    },
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
  ];

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: colors.background }}
    >
      <NavBar
        variant="minimal"
        title="Discover Circles"
        onBack={() => router.back()}
        colors={colors}
      />

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative group flex-1">
              <Search
                className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity sm:size-[22px]"
                size={18}
                style={{ color: colors.text }}
              />
              <input
                type="text"
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-5 rounded-2xl sm:rounded-3xl border-2 transition-all focus:outline-none focus:ring-0 font-bold bg-background text-foreground shadow-sm hover:shadow-md text-sm sm:text-base"
                style={{ borderColor: colors.border }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 sm:px-6 rounded-2xl sm:rounded-3xl border-2 transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[9px] sm:text-[10px] ${showFilters ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-surface opacity-70"}`}
              style={
                !showFilters
                  ? { borderColor: colors.border, color: colors.text }
                  : {}
              }
            >
              <Filter size={16} className="sm:size-[18px]" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div
              className="p-5 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border-2 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-top-4 duration-300"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="sm:size-4 text-primary" />
                    <label className="text-[9px] sm:text-xs font-black uppercase tracking-widest opacity-40">
                      Contrib. Range ($)
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minContribution}
                      onChange={(e) => setMinContribution(e.target.value)}
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 bg-background focus:outline-none focus:ring-0 font-bold text-xs sm:text-sm"
                      style={{ borderColor: colors.border }}
                    />
                    <div className="w-3 sm:w-4 h-0.5 bg-border rounded-full opacity-30" />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxContribution}
                      onChange={(e) => setMaxContribution(e.target.value)}
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 bg-background focus:outline-none focus:ring-0 font-bold text-xs sm:text-sm"
                      style={{ borderColor: colors.border }}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="sm:size-4 text-primary" />
                    <label className="text-[9px] sm:text-xs font-black uppercase tracking-widest opacity-40">
                      Collat. Range ($)
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minCollateral}
                      onChange={(e) => setMinCollateral(e.target.value)}
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 bg-background focus:outline-none focus:ring-0 font-bold text-xs sm:text-sm"
                      style={{ borderColor: colors.border }}
                    />
                    <div className="w-3 sm:w-4 h-0.5 bg-border rounded-full opacity-30" />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxCollateral}
                      onChange={(e) => setMaxCollateral(e.target.value)}
                      className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 bg-background focus:outline-none focus:ring-0 font-bold text-xs sm:text-sm"
                      style={{ borderColor: colors.border }}
                    />
                  </div>
                </div>
              </div>

              <div
                className="flex justify-end pt-2 border-t border-dashed"
                style={{ borderColor: colors.border }}
              >
                <button
                  onClick={() => {
                    setMinContribution("");
                    setMaxContribution("");
                    setMinCollateral("");
                    setMaxCollateral("");
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-50 hover:opacity-100 transition-opacity"
                >
                  Reset Ranges
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
            {filters.map((f) => {
              const ButtonContent = (
                <button
                  key={f.id}
                  onClick={() =>
                    setActiveFilter(
                      f.id as
                        | "all"
                        | "public"
                        | "private"
                        | "daily"
                        | "weekly"
                        | "monthly",
                    )
                  }
                  className="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap flex items-center gap-2"
                  style={
                    activeFilter === f.id
                      ? {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                          color: "white",
                          boxShadow:
                            "0 8px 20px -8px hsla(var(--primary) / 0.5)",
                        }
                      : {
                          borderColor: colors.border,
                          color: colors.text,
                          opacity: 0.5,
                          backgroundColor: colors.surface,
                        }
                  }
                >
                  {f.icon && <f.icon size={12} />}
                  {f.label}
                </button>
              );

              return (
                <React.Fragment key={f.id}>{ButtonContent}</React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2
              className="text-xl font-black tracking-tight"
              style={{ color: colors.text }}
            >
              Available Circles
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
              {filteredCircles.length} Opportunities
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
                Sourcing Circles...
              </p>
            </div>
          ) : filteredCircles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              {filteredCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="group p-6 rounded-[3rem] border-2 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 cursor-pointer relative overflow-hidden active:scale-95 duration-300"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                  onClick={() => setSelectedCircle(circle)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-lg font-black tracking-tight line-clamp-1"
                          style={{ color: colors.text }}
                        >
                          {circle.circleName}
                        </h3>
                        {Number(circle.visibility) === 0 ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider shrink-0 cursor-help">
                            <Lock size={10} />
                            Private
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider shrink-0 cursor-help">
                            <Globe size={10} />
                            Public
                          </div>
                        )}
                      </div>
                      <p className="text-xs opacity-50 font-bold line-clamp-2 leading-relaxed">
                        {circle.circleDescription}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div
                      className="p-4 rounded-3xl bg-opacity-70 flex flex-col gap-1"
                      style={{ backgroundColor: colors.background }}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-30">
                        Per cycle
                      </span>
                      <span className="text-base font-black">
                        $
                        {Number(
                          formatUnits(
                            BigInt(circle.contributionAmount || "0"),
                            6,
                          ),
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div
                      className="p-4 rounded-3xl bg-opacity-70 flex flex-col gap-1"
                      style={{ backgroundColor: colors.background }}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-30">
                        Members
                      </span>
                      <span className="text-base font-black">
                        {circle.currentMembers}/{circle.maxMembers}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between mt-auto pt-4 border-t border-dashed"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-30">
                        Creator
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate max-w-[100px]">
                        {circle.creator.username || "Anonymous"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Join
                      </span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-[3rem] border-2 border-dashed"
              style={{
                borderColor: colors.border,
                backgroundColor: `${colors.surface}40`,
              }}
            >
              <Filter size={48} className="opacity-10 mb-6" />
              <h3 className="text-2xl font-black tracking-tight">
                No circles found
              </h3>
              <p className="text-sm opacity-40 font-bold max-w-xs mx-auto mt-3 leading-relaxed">
                Adjust your filters or try a different search term to find
                active savings circles.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
                className="mt-8 px-8 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-90 active:scale-95"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      {selectedCircle && (
        <JoinCircleModal
          isOpen={!!selectedCircle}
          circle={selectedCircle}
          isLoading={isJoining}
          onClose={() => setSelectedCircle(null)}
          onJoin={handleJoin}
        />
      )}
    </div>
  );
}

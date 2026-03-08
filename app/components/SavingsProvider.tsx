"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import {
  GET_USER_SAVINGS_SUMMARY,
  GET_CIRCLES_BY_IDS,
} from "../graphql/savingsQueries";
import {
  Circle,
  PersonalGoal,
  RawPersonalGoal,
  ActiveCircle,
  transformPersonalGoal,
} from "../types/savings";
import { useAccountAddress } from "../hooks/useAccountAddress";
import { transformCircleToActiveCircle } from "../lib/circleUtils";
import { formatUnits } from "viem";
import { ProfileResponse } from "../types/profile";

type GraphUser = {
  id: string;
  totalGoalsCompleted?: string;
  totalCirclesCompleted?: string;
  totalReputation?: string;
  repCategory?: string;
};
type GraphCircle = {
  circleId: string;
  collateralAmount: string;
  contributionAmount: string;
  currentRound: string;
  frequency: number;
  maxMembers: string;
  currentMembers: string;
  startedAt: string;
  creator: GraphUser;
  [key: string]: unknown;
};
type GraphJoined = {
  circleId: string;
  user: GraphUser;
  [key: string]: unknown;
};
type GraphPosition = {
  circleId: string;
  user: GraphUser;
  position: string;
  [key: string]: unknown;
};
type GraphForfeit = {
  circleId: string;
  forfeitedUser: GraphUser;
  deductionAmount: string;
  [key: string]: unknown;
};
type GraphContribution = {
  circleId: string;
  user: GraphUser;
  round: string;
  amount?: string;
};
type GraphPayout = {
  circleId: string;
  user: GraphUser;
  round: string;
};

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

interface SavingsContextType {
  personalGoals: PersonalGoal[];
  circles: ActiveCircle[];
  totalGoalsCompleted: number;
  totalCirclesCompleted: number;
  reputation: number;
  trustCategory: number;
  totalSavedCircles: string;
  totalPayoutsCircles: string;
  totalPenaltiesCircles: string;
  isLoading: boolean;
  refetch: () => void;
  error: Error | null;
  address?: string;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export function SavingsProvider({ children }: { children: ReactNode }) {
  const { address: rawAddress, isInitializing } = useAccountAddress();
  const address = rawAddress?.toLowerCase();

  // 1. Fetch User Summary (Goals, Reputation, Circle IDs)
  const {
    data,
    isLoading: isSummaryLoading,
    refetch,
    error: summaryError,
  } = useQuery<Record<string, unknown>>({
    queryKey: ["userSavings", address],
    queryFn: async () => {
      if (!address || !SUBGRAPH_URL)
        return {
          user: null,
          personalGoals: [],
          circlesJoined: [],
          circlesCreated: [],
        };
      return request<Record<string, unknown>>(
        SUBGRAPH_URL,
        GET_USER_SAVINGS_SUMMARY,
        {
          address,
          userAddress: address,
        },
      );
    },
    enabled: !!address && !!SUBGRAPH_URL && !isInitializing,
    refetchInterval: 30000,
  });

  // 2. Combine and Deduplicate Circle IDs
  const joinedIds = useMemo(() => {
    const joined = (data?.circlesJoined as GraphJoined[]) || [];
    return Array.from(new Set(joined.map((cj) => String(cj.circleId))));
  }, [data]);

  // 3. Fetch Circle Details for all involved circles
  const {
    data: circlesData,
    isLoading: isCirclesLoading,
    error: circlesError,
  } = useQuery({
    queryKey: ["circlesDetails", joinedIds, address],
    queryFn: async () => {
      if (!joinedIds || joinedIds.length === 0 || !address)
        return { circles: [] };
      return request<{ circles: Record<string, unknown>[] }>(
        SUBGRAPH_URL,
        GET_CIRCLES_BY_IDS,
        {
          ids: joinedIds,
          address: address,
        },
      );
    },
    enabled: !!SUBGRAPH_URL && joinedIds.length > 0 && !!address,
  });

  // 4. Fetch Profiles for all involved members and creators
  const memberAddresses = useMemo(() => {
    const rawCircles = (circlesData?.circles as GraphCircle[]) || [];
    const joined =
      ((circlesData as Record<string, unknown>)
        ?.circleJoineds as GraphJoined[]) || [];
    const addresses = new Set<string>();

    joined.forEach((jm) => addresses.add(jm.user.id.toLowerCase()));
    rawCircles.forEach((c) => addresses.add(c.creator.id.toLowerCase()));

    return Array.from(addresses);
  }, [circlesData]);

  const { data: profilesData } = useQuery<ProfileResponse[]>({
    queryKey: ["membersProfiles", memberAddresses],
    queryFn: async () => {
      if (memberAddresses.length === 0) return [];
      const res = await fetch("/api/profile/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses: memberAddresses }),
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: memberAddresses.length > 0,
  });

  const profilesMap = useMemo(() => {
    const map: Record<string, ProfileResponse> = {};
    (profilesData || []).forEach((p) => {
      map[p.walletAddress?.toLowerCase() || ""] = p;
    });
    return map;
  }, [profilesData]);

  const activeCircles = useMemo(() => {
    const rawCircles = (circlesData?.circles as GraphCircle[]) || [];
    const joinedMembers =
      ((circlesData as Record<string, unknown>)
        ?.circleJoineds as GraphJoined[]) || [];
    const assignedPositions =
      ((circlesData as Record<string, unknown>)
        ?.positionAssigneds as GraphPosition[]) || [];
    const allContributions =
      ((circlesData as Record<string, unknown>)
        ?.contributionMades as GraphContribution[]) || [];
    const allPayouts =
      ((circlesData as Record<string, unknown>)
        ?.payoutDistributeds as GraphPayout[]) || [];

    return rawCircles.map((c) => {
      // Reconstruct members for this circle
      const membersForCircle = joinedMembers
        .filter((jm) => jm.circleId.toString() === c.circleId.toString())
        .map((jm) => {
          const addr = jm.user.id.toLowerCase();
          const pos = assignedPositions.find(
            (ap) =>
              ap.circleId.toString() === c.circleId.toString() &&
              ap.user.id.toLowerCase() === addr,
          );
          const profile = profilesMap[addr];
          const isCurrentUser = address && addr === address;

          const fullName = isCurrentUser
            ? "You"
            : profile
              ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
                profile.username
              : addr.slice(0, 8);

          const userName = profile?.username || addr.slice(0, 8);

          const hasContributed = allContributions.some(
            (cm) =>
              cm.circleId.toString() === c.circleId.toString() &&
              cm.user.id.toLowerCase() === addr &&
              cm.round.toString() === c.currentRound.toString(),
          );

          const hasReceivedPayout = allPayouts.some(
            (pm) =>
              pm.circleId.toString() === c.circleId.toString() &&
              pm.user.id.toLowerCase() === addr,
          );

          const totalContributed = allContributions
            .filter(
              (cm) =>
                cm.circleId.toString() === c.circleId.toString() &&
                cm.user.id.toLowerCase() === addr,
            )
            .reduce((acc, cm) => acc + BigInt(cm.amount || 0), 0n);

          return {
            id: addr,
            user: jm.user,
            username: userName,
            fullName: fullName,
            avatar: profile?.profilePhoto || null,
            position: pos ? Number(pos.position) : 0,
            isActive: true,
            hasContributed,
            hasReceivedPayout,
            isForfeited: (
              (data?.memberForfeiteds as GraphForfeit[]) || []
            ).some(
              (f) =>
                f.circleId.toString() === c.circleId.toString() &&
                f.forfeitedUser?.id?.toLowerCase() === addr,
            ),
            totalContributed: totalContributed.toString(),
            collateralLocked: c.collateralAmount,
          };
        });

      const creatorAddr = c.creator.id.toLowerCase();
      const isCreatorSelf = address && creatorAddr === address;
      const creatorProfile = profilesMap[creatorAddr];

      const creatorFullName = isCreatorSelf
        ? "You"
        : creatorProfile
          ? `${creatorProfile.firstName || ""} ${creatorProfile.lastName || ""}`.trim() ||
            creatorProfile.username
          : creatorAddr.slice(0, 8);

      const creatorUserName =
        creatorProfile?.username || creatorAddr.slice(0, 8);

      const transformed = transformCircleToActiveCircle(
        {
          ...c,
          members: membersForCircle,
          creator: {
            ...c.creator,
            username: creatorUserName,
            fullName: creatorFullName,
            avatarUrl: creatorProfile?.profilePhoto,
          },
        } as unknown as Circle,
        address,
      );

      // Determine if the user has contributed to this specific circle in the current round
      const contributionMades =
        (data?.contributionMades as Array<{
          circleId: string;
          round: string;
        }>) || [];
      const hasContributedThisRound = contributionMades.some(
        (cm) =>
          cm.circleId.toString() === c.circleId.toString() &&
          cm.round.toString() === c.currentRound.toString(),
      );

      return {
        ...transformed,
        hasContributed: hasContributedThisRound,
      };
    });
  }, [
    circlesData,
    address,
    data?.memberForfeiteds,
    data?.contributionMades,
    profilesMap,
  ]);

  // Calculate Statistics for Circles (using aggregate data from summary)
  const circleStats = useMemo(() => {
    let saved = 0n;
    let payouts = 0n;
    let penalties = 0n;

    // 1. Total Saved = user's contributions + total locked collateral
    ((data?.contributionMades as Array<{ amount: string }>) || []).forEach(
      (c) => {
        saved += BigInt(c.amount || 0);
      },
    );

    // Add collateral for each circle the user is in
    activeCircles.forEach((circle) => {
      // Find if user is in this circle
      const isMember = joinedIds.includes(circle.rawCircle.circleId.toString());
      if (isMember) {
        saved += BigInt(circle.rawCircle.collateralAmount || 0);
      }
    });

    // 2. Payouts = Sum of all payout distributions
    (
      (data?.payoutDistributeds as Array<{ payoutAmount: string }>) || []
    ).forEach((p) => {
      payouts += BigInt(p.payoutAmount || 0);
    });

    // 3. Penalties = Sum of forfeiture deductions
    ((data?.memberForfeiteds as GraphForfeit[]) || []).forEach((f) => {
      penalties += BigInt(f.deductionAmount || 0);
    });

    return {
      saved: formatUnits(saved, 6),
      payouts: formatUnits(payouts, 6),
      penalties: formatUnits(penalties, 6),
    };
  }, [data, activeCircles, joinedIds]);

  const value: SavingsContextType = {
    personalGoals: ((data?.personalGoals as RawPersonalGoal[]) || []).map(
      transformPersonalGoal,
    ),
    circles: activeCircles,
    totalGoalsCompleted:
      Number((data?.user as GraphUser)?.totalGoalsCompleted) || 0,
    totalCirclesCompleted:
      Number((data?.user as GraphUser)?.totalCirclesCompleted) || 0,
    reputation: Number((data?.user as GraphUser)?.totalReputation) || 0,
    trustCategory: Number((data?.user as GraphUser)?.repCategory) || 0,
    totalSavedCircles: circleStats.saved,
    totalPayoutsCircles: circleStats.payouts,
    totalPenaltiesCircles: circleStats.penalties,
    isLoading: isSummaryLoading || isInitializing || isCirclesLoading,
    refetch,
    error: (summaryError || circlesError) as Error | null,
    address,
  };

  return (
    <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>
  );
}

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error("useSavings must be used within a SavingsProvider");
  }
  return context;
};

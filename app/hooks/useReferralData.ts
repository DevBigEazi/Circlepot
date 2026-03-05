"use client";

import { useQuery } from "@tanstack/react-query";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { GET_USER_REFERRALS } from "../graphql/referralQueries";
import { Profile } from "../types/profile";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

interface SubgraphReferralReward {
  id: string;
  token: string;
  rewardAmount: string;
  transaction: {
    blockTimestamp: string;
  };
}

interface SubgraphUser {
  id: string;
  referralCount: string;
  totalReferralRewardsEarned: string;
  pendingRewardsEarned: string;
  referrals: { id: string }[];
  referralRewards: SubgraphReferralReward[];
}

export interface ReferralData {
  referralCount: number;
  totalEarned: bigint;
  pendingEarned: bigint;
  referrals: (Profile & { address: string })[];
  rewards: SubgraphReferralReward[];
}

export const useReferralData = () => {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address?.toLowerCase();

  return useQuery({
    queryKey: ["referralData", address],
    queryFn: async (): Promise<ReferralData | null> => {
      if (!address || !SUBGRAPH_URL) return null;

      // 1. Fetch from Subgraph
      const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: GET_USER_REFERRALS,
          variables: { address },
        }),
      });

      const { data, errors } = await response.json();
      if (errors) throw new Error(errors[0].message);

      const user: SubgraphUser | null = data.user;
      if (!user) {
        return {
          referralCount: 0,
          totalEarned: BigInt(0),
          pendingEarned: BigInt(0),
          referrals: [],
          rewards: [],
        };
      }

      // 2. Fetch Profile Details from MongoDB for all referred addresses
      const referralAddresses = user.referrals.map((r) => r.id);
      let referralProfiles: Profile[] = [];

      if (referralAddresses.length > 0) {
        const profileRes = await fetch("/api/profile/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: referralAddresses }),
        });
        if (profileRes.ok) {
          referralProfiles = await profileRes.json();
        }
      }

      // 3. Merge data
      const mergedReferrals = referralAddresses.map((addr) => {
        const profile = referralProfiles.find(
          (p) => p.walletAddress?.toLowerCase() === addr.toLowerCase(),
        );
        return {
          ...(profile || ({} as Profile)),
          address: addr,
        };
      });

      return {
        referralCount: parseInt(user.referralCount),
        totalEarned: BigInt(user.totalReferralRewardsEarned),
        pendingEarned: BigInt(user.pendingRewardsEarned),
        referrals: mergedReferrals as (Profile & { address: string })[],
        rewards: user.referralRewards,
      };
    },
    enabled: !!address && !!SUBGRAPH_URL,
  });
};

"use client";

import { useQuery } from "@tanstack/react-query";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { CreditScore, ScoreCategory } from "../types/credit";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

const REPUTATION_QUERY = `
  query GetUserReputation($userId: String!) {
    user(id: $userId) {
      id
      username
      fullName
      repCategory
      totalReputation
      totalLatePayments
      totalGoalsCompleted
      totalCirclesCompleted
    }
  }
`;

const getCategoryLabel = (category: number): string => {
  switch (category) {
    case ScoreCategory.POOR:
      return "Poor (300-579)";
    case ScoreCategory.FAIR:
      return "Fair (580-669)";
    case ScoreCategory.GOOD:
      return "Good (670-739)";
    case ScoreCategory.VERY_GOOD:
      return "Very Good (740-799)";
    case ScoreCategory.EXCEPTIONAL:
      return "Exceptional (800-850)";
    default:
      return "Unknown";
  }
};

const getCategoryColor = (category: number): string => {
  switch (category) {
    case ScoreCategory.POOR:
      return "#EF4444"; // Red
    case ScoreCategory.FAIR:
      return "#F59E0B"; // Orange
    case ScoreCategory.GOOD:
      return "#10B981"; // Green
    case ScoreCategory.VERY_GOOD:
      return "#3B82F6"; // Blue
    case ScoreCategory.EXCEPTIONAL:
      return "#8B5CF6"; // Purple
    default:
      return "#6B7280"; // Gray
  }
};

export const useCreditScore = () => {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address?.toLowerCase();

  return useQuery({
    queryKey: ["creditScore", address],
    queryFn: async (): Promise<CreditScore> => {
      if (!address || !SUBGRAPH_URL) {
        return {
          score: 300,
          category: ScoreCategory.POOR,
          categoryLabel: getCategoryLabel(ScoreCategory.POOR),
          categoryColor: getCategoryColor(ScoreCategory.POOR),
          totalCirclesCompleted: 0,
          totalGoalsCompleted: 0,
          totalLatePayments: 0,
        };
      }

      const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: REPUTATION_QUERY,
          variables: { userId: address },
        }),
      });

      const { data } = await response.json();
      const user = data?.user;

      if (user) {
        const score = Number(user.totalReputation) || 300;
        const category =
          (user.repCategory as ScoreCategory) ?? ScoreCategory.POOR;

        return {
          score,
          category,
          categoryLabel: getCategoryLabel(category),
          categoryColor: getCategoryColor(category),
          totalCirclesCompleted: Number(user.totalCirclesCompleted) || 0,
          totalGoalsCompleted: Number(user.totalGoalsCompleted) || 0,
          totalLatePayments: Number(user.totalLatePayments) || 0,
        };
      }

      return {
        score: 300,
        category: ScoreCategory.POOR,
        categoryLabel: getCategoryLabel(ScoreCategory.POOR),
        categoryColor: getCategoryColor(ScoreCategory.POOR),
        totalCirclesCompleted: 0,
        totalGoalsCompleted: 0,
        totalLatePayments: 0,
      };
    },
    enabled: !!address && !!SUBGRAPH_URL,
    staleTime: 60000,
  });
};

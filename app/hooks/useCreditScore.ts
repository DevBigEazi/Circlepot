"use client";

import { ScoreCategory, CreditScore } from "../types/credit";
import { useSavings } from "../components/SavingsProvider";

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

/**
 * Hook to fetch credit score/reputation from the shared SavingsProvider.
 * This centralizes the data source and ensures consistency across the app.
 */
export const useCreditScore = () => {
  const {
    reputation,
    trustCategory,
    totalGoalsCompleted,
    totalCirclesCompleted,
    isLoading,
  } = useSavings();

  const creditScore: CreditScore = {
    score: reputation || 300,
    category: (trustCategory as ScoreCategory) ?? ScoreCategory.POOR,
    categoryLabel: getCategoryLabel(trustCategory ?? ScoreCategory.POOR),
    categoryColor: getCategoryColor(trustCategory ?? ScoreCategory.POOR),
    totalCirclesCompleted: totalCirclesCompleted || 0,
    totalGoalsCompleted: totalGoalsCompleted || 0,
    totalLatePayments: 0, // Not explicitly tracked in summary yet
  };

  return {
    data: creditScore,
    isLoading,
  };
};

"use client";

import { useUserProfile as useProfileContext } from "../components/UserProfileProvider";

/**
 * Hook to consume the UserProfileContext.
 * Centralizes profile state across all components to prevent redundant fetches
 * and infinite sync loops.
 */
export const useUserProfile = () => {
  return useProfileContext();
};

"use client";

import { useQuery } from "@tanstack/react-query";
import { request } from "graphql-request";
import { GET_ALL_CIRCLES, GET_SINGLE_CIRCLE } from "../graphql/savingsQueries";
import { Circle, RawCircle } from "../types/savings";
import { Profile } from "../types/profile";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

/**
 * Hook to fetch and discover joinable savings circles.
 * Fetches data from Subgraph and enriches creators with MongoDB profile info.
 */
export const useBrowseCircles = () => {
  return useQuery({
    queryKey: ["browse-circles"],
    queryFn: async () => {
      if (!SUBGRAPH_URL) return [];

      try {
        // 1. Fetch circles from Subgraph
        const result = await request<{ circles: RawCircle[] }>(
          SUBGRAPH_URL,
          GET_ALL_CIRCLES,
        );

        const circles = result.circles || [];
        if (circles.length === 0) return [];

        // 2. Extract unique creator addresses for profile enrichment
        const creatorAddresses = Array.from(
          new Set(circles.map((c) => c.creator.id.toLowerCase())),
        );

        // 3. Fetch profiles in bulk from our MongoDB API
        const profileResponse = await fetch("/api/profile/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: creatorAddresses }),
        });

        if (profileResponse.ok) {
          const profiles: Profile[] = await profileResponse.json();
          const profileMap = new Map(
            profiles.map((p) => [p.walletAddress?.toLowerCase(), p]),
          );

          // 4. Enrich circles with profile data
          return circles.map((circle) => {
            const addr = circle.creator.id.toLowerCase();
            const profile = profileMap.get(addr);

            return {
              ...circle,
              creator: {
                id: circle.creator.id,
                username: profile?.username || null,
                fullName: profile
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : null,
                avatarUrl: profile?.profilePhoto || null,
              },
            };
          }) as Circle[];
        }

        // Return raw circles if profile fetch fails
        return circles as Circle[];
      } catch (err) {
        console.error("Error in useBrowseCircles:", err);
        throw err;
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

/**
 * Hook to fetch details for a single savings circle by ID.
 * Enriches the creator with MongoDB profile info.
 */
export const useCircleDetails = (circleId?: string) => {
  return useQuery({
    queryKey: ["circle-details", circleId],
    queryFn: async () => {
      if (!SUBGRAPH_URL || !circleId) return null;

      try {
        // 1. Fetch circle from Subgraph using filter
        const result = await request<{ circles: RawCircle[] }>(
          SUBGRAPH_URL,
          GET_SINGLE_CIRCLE,
          { circleId: circleId },
        );

        const circle = result.circles?.[0];
        if (!circle) return null;

        // 2. Fetch profile from MongoDB API
        const profileResponse = await fetch("/api/profile/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addresses: [circle.creator.id.toLowerCase()],
          }),
        });

        if (profileResponse.ok) {
          const profiles: Profile[] = await profileResponse.json();
          const profile = profiles.find(
            (p) =>
              p.walletAddress?.toLowerCase() ===
              circle.creator.id.toLowerCase(),
          );

          if (profile) {
            return {
              ...circle,
              creator: {
                id: circle.creator.id,
                username: profile.username || null,
                fullName: `${profile.firstName} ${profile.lastName}`.trim(),
                avatarUrl: profile.profilePhoto || null,
              },
            } as Circle;
          }
        }

        return circle as Circle;
      } catch (err) {
        console.error("Error in useCircleDetails:", err);
        throw err;
      }
    },
    enabled: !!circleId && !!SUBGRAPH_URL,
    staleTime: 30000,
  });
};

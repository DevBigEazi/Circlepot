"use client";

import { useState, useCallback, useEffect } from "react";
import { useDynamicContext, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { ProfileResponse } from "@/app/types/profile";
import { toast } from "sonner";

export const useUserProfile = () => {
  useDynamicContext();
  const authToken = getAuthToken();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the current user's profile from the API.
   */
  const fetchProfile = useCallback(async () => {
    if (!authToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        setProfile(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch profile");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      console.error("Fetch profile error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  /**
   * Initial fetch when auth token is available.
   */
  useEffect(() => {
    if (authToken && !profile && !isLoading) {
      fetchProfile();
    }
    // NOTE: isLoading intentionally excluded — it's an internal fetch guard,
    // not a trigger condition. Including it caused an infinite re-fetch loop
    // on API errors (isLoading: true → false → re-runs effect → repeat).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, fetchProfile, profile]);

  /**
   * Create a new profile.
   */
  const createProfile = async (formData: {
    username: string;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    referralCode?: string;
  }) => {
    if (!authToken) throw new Error("Not authenticated");

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create profile");
      }

      setProfile(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update existing profile.
   */
  const updateProfile = async (formData: {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string | null;
  }) => {
    if (!authToken) throw new Error("Not authenticated");

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfile(data);
      toast.success("Profile updated successfully");
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if a username is available.
   */
  const checkUsernameAvailability = async (
    username: string,
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/profile/check-username?username=${username}`,
      );
      const data = await response.json();
      return data.available;
    } catch (err) {
      console.error("Check username error:", err);
      return false;
    }
  };

  /**
   * Sync contact info from Dynamic after linking.
   */
  const syncContactInfo = async () => {
    if (!authToken) return;

    try {
      const response = await fetch("/api/profile/sync-contact", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (profile) {
          setProfile({
            ...profile,
            email: data.email,
            phoneNumber: data.phoneNumber,
          });
        }
      }
    } catch (err) {
      console.error("Sync contact error:", err);
    }
  };

  return {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    checkUsernameAvailability,
    syncContactInfo,
    refreshProfile: fetchProfile,
    hasProfile: !!profile,
  };
};

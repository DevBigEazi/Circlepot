"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useDynamicContext,
  getAuthToken,
  useUserUpdateRequest,
  useRefreshUser,
} from "@dynamic-labs/sdk-react-core";
import { ProfileResponse } from "@/app/types/profile";
import { toast } from "sonner";

export const useUserProfile = () => {
  const { user: dynamicUser } = useDynamicContext();
  const { updateUser } = useUserUpdateRequest();
  const refreshUser = useRefreshUser();
  const authToken = getAuthToken();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Silently sync contact info from the JWT into MongoDB.
   * Fire-and-forget — never blocks UI or shows loading state.
   */
  const silentSyncContacts = useCallback(
    async (currentProfile: ProfileResponse) => {
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
          // Only update state if values actually changed
          if (
            data.email !== currentProfile.email ||
            data.phoneNumber !== currentProfile.phoneNumber
          ) {
            setProfile((prev) =>
              prev
                ? { ...prev, email: data.email, phoneNumber: data.phoneNumber }
                : prev,
            );
          }
        }
      } catch {
        // Silent — don't surface sync failures to the user
      }
    },
    [authToken],
  );

  /**
   * Fetch the current user's profile from the API.
   * After a successful fetch, silently syncs contact info in the background.
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
        // Fire-and-forget: sync contact info from JWT in the background
        silentSyncContacts(data);
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
  }, [authToken, silentSyncContacts]);

  /**
   * REACTIVE SYNC: Watch for changes in the Dynamic User object.
   * If Dynamic updates (e.g., via Widget or Modal), we sync to our DB.
   */
  useEffect(() => {
    if (dynamicUser && profile && authToken) {
      const needsSync =
        (dynamicUser.email && dynamicUser.email !== profile.email) ||
        (dynamicUser.phoneNumber &&
          dynamicUser.phoneNumber !== profile.phoneNumber);

      if (needsSync) {
        console.log("Reactive sync triggered: Dynamic data changed");
        silentSyncContacts(profile);
      }
    }
  }, [dynamicUser, profile, authToken, silentSyncContacts]);

  /**
   * Initial fetch when auth token is available.
   */
  useEffect(() => {
    if (authToken && !profile && !isLoading) {
      fetchProfile();
    }
  }, [authToken, fetchProfile, profile]);

  /**
   * Create a new profile.
   */
  const createProfile = async (formData: {
    username: string;
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    walletAddress?: string | null;
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
      // 1. Sync name changes to Dynamic.xyz Dashboard
      if (formData.firstName || formData.lastName) {
        await updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        await refreshUser();
      }

      // 2. Update our MongoDB
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

  return {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    checkUsernameAvailability,
    refreshProfile: fetchProfile,
    hasProfile: !!profile,
  };
};

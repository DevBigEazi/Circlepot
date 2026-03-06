"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  useDynamicContext,
  getAuthToken,
  useUserUpdateRequest,
  useRefreshUser,
} from "@dynamic-labs/sdk-react-core";
import { useAccountAddress } from "@/app/hooks/useAccountAddress";
import { ProfileResponse } from "@/app/types/profile";
import { toast } from "sonner";

interface UserProfileContextType {
  profile: ProfileResponse | null | undefined;
  isLoading: boolean;
  error: string | null;
  createProfile: (
    formData: Partial<ProfileResponse> & { referralCode?: string },
  ) => Promise<ProfileResponse>;
  updateProfile: (
    formData: Partial<ProfileResponse>,
  ) => Promise<ProfileResponse>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  hasProfile: boolean;
  profileExists: boolean;
  profileNotFound: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined,
);

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: dynamicUser } = useDynamicContext();
  const { isInitializing: isAccountInitializing } = useAccountAddress();
  const { updateUser } = useUserUpdateRequest();
  const refreshUser = useRefreshUser();
  const authToken = getAuthToken();

  const [profile, setProfile] = useState<ProfileResponse | null | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInProgress = useRef(false);
  const syncInProgress = useRef(false);

  // Memoize sync to prevent unnecessary re-runs
  const silentSyncContacts = useCallback(
    async (currentProfile: ProfileResponse) => {
      if (!authToken || syncInProgress.current) return;

      syncInProgress.current = true;
      try {
        const response = await fetch("/api/profile/sync-contact", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (currentProfile) {
            const hasChanged =
              (data.email &&
                data.email.toLowerCase() !==
                  currentProfile.email?.toLowerCase()) ||
              (data.phoneNumber &&
                data.phoneNumber !== currentProfile.phoneNumber);

            if (hasChanged) {
              setProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      email: data.email,
                      phoneNumber: data.phoneNumber,
                    }
                  : prev,
              );
            }
          }
        }
      } catch (err) {
        console.warn("Silent sync failed", err);
      } finally {
        syncInProgress.current = false;
      }
    },
    [authToken],
  );

  const fetchProfile = useCallback(async () => {
    if (!authToken || fetchInProgress.current || isAccountInitializing) return;

    fetchInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (data) {
          silentSyncContacts(data);
        }
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
      setProfile(null);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [authToken, silentSyncContacts, isAccountInitializing]);

  useEffect(() => {
    if (
      authToken &&
      profile === undefined &&
      !isLoading &&
      !isAccountInitializing
    ) {
      fetchProfile();
    }
  }, [authToken, profile, isLoading, fetchProfile, isAccountInitializing]);

  // Reactive sync when dynamic user data changes
  useEffect(() => {
    if (dynamicUser && profile && authToken && !syncInProgress.current) {
      const dynamicEmail = dynamicUser.email?.toLowerCase();
      const profileEmail = profile.email?.toLowerCase();
      const dynamicPhone = dynamicUser.phoneNumber;
      const profilePhone = profile.phoneNumber;

      const needsSync =
        (dynamicEmail && dynamicEmail !== profileEmail) ||
        (dynamicPhone && dynamicPhone !== profilePhone);

      if (needsSync) {
        silentSyncContacts(profile);
      }
    }
  }, [
    dynamicUser?.email,
    dynamicUser?.phoneNumber,
    profile?.email,
    profile?.phoneNumber,
    authToken,
    silentSyncContacts,
    dynamicUser, // Added to satisfy exhausted-deps
    profile, // Added to satisfy exhausted-deps
  ]);

  const createProfile = async (
    formData: Partial<ProfileResponse> & { referralCode?: string },
  ) => {
    if (!authToken) throw new Error("Not authenticated");
    setIsLoading(true);
    try {
      const res = await fetch("/api/profile/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create profile");
      setProfile(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (formData: Partial<ProfileResponse>) => {
    if (!authToken) throw new Error("Not authenticated");
    setIsLoading(true);
    try {
      if (formData.firstName || formData.lastName) {
        await updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        await refreshUser();
      }
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfile(data);
      toast.success("Profile updated");
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    try {
      const res = await fetch(
        `/api/profile/check-username?username=${username}`,
      );
      const data = await res.json();
      return data.available;
    } catch {
      return false;
    }
  };

  const value = {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    checkUsernameAvailability,
    refreshProfile: fetchProfile,
    hasProfile: profile !== null && profile !== undefined,
    profileExists: profile !== null && profile !== undefined,
    profileNotFound: profile === null,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}

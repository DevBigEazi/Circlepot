"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const REFERRAL_KEY = "cp_referral_code";

export default function ReferralCapturer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem(REFERRAL_KEY, ref.trim());
      console.log(`Captured referral code: ${ref}`);

      // We don't clean the URL here because useSearchParams is reactive,
      // and cleaning the URL might trigger unwanted side effects in some setups.
      // But for consistency with the React app, we'll keep the toast if not already set.
      const hasProfileId =
        localStorage.getItem("circlepot_profile_loaded") === "true";
      if (!hasProfileId) {
        toast.info("Welcome to Circlepot!", {
          description: `You've been referred by ${ref}. Complete your account to join the community.`,
          duration: 5000,
        });
      }
    }
  }, [searchParams]);

  return null;
}

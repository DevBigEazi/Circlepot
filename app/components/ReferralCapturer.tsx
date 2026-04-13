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
      const storedRef = ref.trim();
      localStorage.setItem(REFERRAL_KEY, storedRef);

      // Attempt to resolve the inviter's name for a better UX
      const resolveInviter = async () => {
        try {
          const res = await fetch(`/api/profile/resolve-referrer?code=${encodeURIComponent(storedRef)}`);
          if (res.ok) {
            const data = await res.json();
            const fullName = `${data.firstName} ${data.lastName}`.trim();
            
            const hasProfileLoaded = localStorage.getItem("circlepot_profile_loaded") === "true";
            if (!hasProfileLoaded) {
              toast.info("Welcome to Circlepot! 👋", {
                description: `You've been invited by ${fullName}. Complete your setup to join the community.`,
                duration: 6000,
              });
            }
          }
        } catch (err) {
          console.error("Failed to resolve inviter:", err);
          // Fallback to anonymous toast if resolution fails
          toast.info("Welcome to Circlepot!", {
            description: "You've been invited by a friend. Join now to start saving!",
            duration: 5000,
          });
        }
      };

      resolveInviter();
    }
  }, [searchParams]);

  return null;
}

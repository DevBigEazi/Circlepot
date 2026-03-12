import webpush from "web-push";
import { getDb } from "./mongodb";
import type {
  BackendNotificationPayload,
  NotificationPreferences,
} from "@/app/types/notifications";
import type { PushSubscription } from "@/app/types/notifications";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = "mailto:support@circlepot.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Maps NotificationType → the NotificationPreferences key that gates it.
// Only types that should be gatable by the user are here.
// System alerts (system_maintenance, system_update, security_alert) are always delivered.
// Goal reminders / milestones are cron-driven and always fire when scheduled.
const NOTIFICATION_TYPE_TO_PREFERENCE_KEY: Partial<
  Record<string, keyof NotificationPreferences>
> = {
  // ── Circle lifecycle (from CircleSavings.sol) ──────────────────────────────
  circle_joined:            "circleJoined",           // CircleJoined
  circle_started:           "circleStarted",           // CircleStarted
  circle_completed:         "circleCompleted",         // Circle fully done
  circle_dead:              "circleDead",              // DeadCircleFeeDeducted

  // ── Member activity ────────────────────────────────────────────────────────
  circle_member_joined:     "circleMemberJoined",      // CircleJoined (others)
  circle_member_contributed:"circleMemberContributed", // ContributionMade (others)
  circle_member_payout:     "circleMemberPayout",      // PayoutDistributed (others)
  member_forfeited:         "memberForfeited",          // MemberForfeited
  position_assigned:        "positionAssigned",         // PositionAssigned
  collateral_returned:      "collateralReturned",       // CollateralReturned

  // ── Payments & contributions ───────────────────────────────────────────────
  contribution_due:         "contributionDue",          // Deadline approaching (cron)
  late_payment_warning:     "latePaymentWarning",       // LateContributionMade
  payment_received:         "paymentReceived",          // PayoutDistributed (self)
  payment_late:             "paymentLate",              // LatePaymentRecorded (Reputation)

  // ── Voting (from CircleSavings.sol) ───────────────────────────────────────
  vote_required:            "voteRequired",             // VotingInitiated
  vote_executed:            "voteExecuted",             // VoteExecuted
  circle_voting:            "circleVoting",             // VoteCast by others

  // ── Personal Goals (from PersonalSavings.sol) ─────────────────────────────
  goal_completed:           "goalCompleted",            // GoalWithdrawn (full amount)
  goal_contribution_due:    "goalContributionDue",      // Deadline approaching (cron)
  goal_deadline_2days:      "goalDeadline2Days",        // Cron reminder
  goal_deadline_1day:       "goalDeadline1Day",         // Cron reminder

  // ── Social ────────────────────────────────────────────────────────────────
  circle_invite:            "circleInvite",             // MemberInvited on-chain

  // ── Reputation ────────────────────────────────────────────────────────────
  credit_score_changed:     "creditScoreChanged",       // ReputationIncreased / Decreased

  // ── Referrals (from ReferralRewards.sol) ──────────────────────────────────
  referral_reward:          "referralReward",           // ReferralRewardPaid
};

interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a push notification to a single user by their Smart Account wallet address.
 */
export async function sendPushNotification(
  userAddress: string,
  payload: BackendNotificationPayload
): Promise<SendResult> {
  if (!userAddress) return { success: false, error: "No user address" };

  try {
    const db = await getDb();
    const profile = await db.collection("profiles").findOne({
      walletAddress: userAddress.toLowerCase(),
    });

    if (!profile?.pushSubscription) {
      return { success: false, error: "No subscription found for user" };
    }

    // Respect user notification preferences
    if (payload.type && profile.notificationPreferences) {
      const prefKey = NOTIFICATION_TYPE_TO_PREFERENCE_KEY[payload.type];
      const prefs = profile.notificationPreferences as NotificationPreferences;
      if (prefKey && prefs[prefKey] === false) {
        return {
          success: false,
          error: "Notification disabled by user preferences",
        };
      }
    }

    const subscription = profile.pushSubscription as PushSubscription;

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.message,
        data: {
          url: payload.action?.action ?? "/",
          ...payload.data,
        },
      })
    );

    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };

    // Subscription expired or gone — clean it up
    if (error.statusCode === 410 || error.statusCode === 404) {
      const db = await getDb();
      await db
        .collection("profiles")
        .updateOne(
          { walletAddress: userAddress.toLowerCase() },
          { $unset: { pushSubscription: "" } }
        );
    }

    console.error("Error sending push notification:", error.message);
    return { success: false, error: error.message ?? "Unknown error" };
  }
}

/**
 * Sends push notifications to multiple users at once.
 */
export async function sendPushNotificationToMany(
  userAddresses: string[],
  payload: BackendNotificationPayload
): Promise<SendResult[]> {
  return Promise.all(
    userAddresses
      .filter(Boolean)
      .map((addr) => sendPushNotification(addr, payload))
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import {
  sendPushNotification,
  sendPushNotificationToMany,
} from "@/lib/notifications";
import { getDb } from "@/lib/mongodb";
import type {
  BackendNotificationPayload,
  NotificationType,
} from "@/app/types/notifications";

const ALCHEMY_WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET;

// ─── Contract Addresses (lowercase for comparison) ────────────────────────────
const CIRCLE_CONTRACT  = process.env.NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT?.toLowerCase();
const PERSONAL_CONTRACT = process.env.NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT?.toLowerCase();

// ─── Event Topic → NotificationType mapping ───────────────────────────────────
// Hashes computed from exact Solidity event signatures in the contracts.
// Enum types (uint8) used for: CircleState, Frequency, Visibility, VoteChoice
const TOPIC_TO_NOTIFICATION: Record<string, NotificationType> = {
  // CircleSavings.sol events
  "0x215c516fbbb103ce0a14103afb5fea2d54075884678cb3cf5c11b5b2cbbe267f": "circle_joined",           // CircleJoined(uint256,address,uint256,uint8)
  "0xc7180c856851f800a67b85b303ad465aeba4073ae61833f1f8368eaaa68f28ae": "circle_started",          // CircleStarted(uint256,uint256,uint8,uint256)
  "0xb20bb7e070cafe1e38bef320d589a411079d043eb11bb511d31558f1336cdc91": "payment_received",        // PayoutDistributed(uint256,uint256,address,uint256,address,uint256)
  "0xfc79da6c5316f4c3a2841a4a8ee84045b0cda7f9c0b91deec048b7f26d4293cf": "position_assigned",      // PositionAssigned(uint256,address,uint256)
  "0x396a26677889e884b8ff5169fa1a6d8c651b2211e377c76ad6dd6b7550f84615": "vote_required",           // VotingInitiated(uint256,uint256,uint256)
  "0xeba4866100b822f0f391e610e7edfab790b9e8766c0012733c26b2f1858e8dd7": "circle_voting",           // VoteCast(uint256,address,uint8)
  "0x92dac91084eb5de442e30890982eaf97d79475bde1331a627f2cf1c23f539ff2": "circle_invite",           // MemberInvited(uint256,address,address,uint256)
  "0x7da55ba157db41984697c3f1b900905283b3f9673437a67da9e3bfc9662c3a04": "vote_executed",           // VoteExecuted(uint256,bool,uint256,uint256)
  "0xfeeb68350324774f70842490ce94b284a5cf00f59d0a9f136ebd83595071bf32": "circle_member_contributed",// ContributionMade(uint256,uint256,address,uint256,address)
  "0x49b66e50d59f8ef5bfef5209cfe2aa780093403481b7eefa0ebb161653414c8c": "late_payment_warning",   // LateContributionMade(uint256,uint256,address,uint256,uint256,address)
  "0x97c5c423fc773e128d260f34efc67b80fb64b96872c483bde6202b23f90b5c59": "member_forfeited",       // MemberForfeited(uint256,uint256,address,uint256,address)
  "0x241db3a85fe2a2a551e4b0c9c6ac8d90930d702a05201429540a985460070b4a": "collateral_returned",    // CollateralReturned(uint256,address,uint256,address)
  "0x3e6446e66cbb2825fb508291b9cbfa88be07ad91c16ce90ec7d4b599b26fcd64": "circle_dead",            // DeadCircleFeeDeducted(uint256,address,uint256)
  // PersonalSavings.sol events
  "0xe93d658e221259f1a6c628b3148a1ccb972d41e86d8293730f6b5c07283a6656": "goal_contribution_due",  // GoalContribution(uint256,address,uint256,uint256,address)
  "0x5656304d0eee08f750f7fb957ef17404fa15969088e153293e55dd205d6a9757": "goal_completed",         // GoalWithdrawn(uint256,address,uint256,uint256,address)
};

// ─── Human-readable notification copy for each event ─────────────────────────
const NOTIFICATION_COPY: Record<
  NotificationType,
  { title: string; message: string }
> = {
  circle_joined:              { title: "Welcome to the Circle! 🎉",        message: "You have successfully joined a savings circle." },
  circle_member_joined:       { title: "New Member Joined 👥",              message: "A new member just joined your savings circle." },
  circle_started:             { title: "Circle Started! 🚀",               message: "Your savings circle has officially started. First round is now open." },
  circle_completed:           { title: "Circle Completed 🏁",              message: "Your savings circle has been completed. Well done!" },
  circle_dead:                { title: "Circle Marked as Dead ⚠️",         message: "Your savings circle has been marked as dead due to member defaults." },
  circle_member_contributed:  { title: "Member Contributed 💰",            message: "A member just made their contribution for this round." },
  circle_member_payout:       { title: "Member Received Payout 💸",        message: "A fellow member just received their payout." },
  payment_received:           { title: "Payout Received! 🎊",              message: "Your round payout has been distributed to your wallet." },
  position_assigned:          { title: "Position Assigned 📋",             message: "Your payout position in the circle has been assigned." },
  vote_required:              { title: "Vote Required 🗳️",                 message: "A vote has been initiated in your circle. Cast your vote now." },
  circle_voting:              { title: "Member Voted 🗳️",                  message: "A member has cast their vote in your circle." },
  vote_executed:              { title: "Vote Result 📢",                   message: "The vote in your circle has been finalised." },
  circle_invite:              { title: "Circle Invitation 📩",             message: "You have been invited to join a private savings circle." },
  late_payment_warning:       { title: "Late Payment ⏰",                   message: "A contribution was made late and a fee was applied." },
  payment_late:               { title: "Late Payment Recorded 📉",         message: "A late payment has been recorded on your reputation score." },
  member_forfeited:           { title: "Member Forfeited 🚨",              message: "A member in your circle has been forfeited." },
  collateral_returned:        { title: "Collateral Returned ✅",            message: "Your locked collateral has been returned to your wallet." },
  contribution_due:           { title: "Contribution Due ⏳",              message: "Your circle contribution is due soon. Don't miss it!" },
  goal_completed:             { title: "Goal Completed! 🏆",               message: "You have successfully completed your personal savings goal." },
  goal_contribution_due:      { title: "Goal Contribution Made 📈",        message: "A contribution was added to your personal savings goal." },
  goal_deadline_2days:        { title: "Goal Deadline in 2 Days ⏰",       message: "Your savings goal deadline is approaching in 2 days." },
  goal_deadline_1day:         { title: "Goal Deadline Tomorrow ⚠️",        message: "Your savings goal deadline is tomorrow. Make your final contribution!" },
  credit_score_changed:       { title: "Credit Score Updated 📊",          message: "Your Circlepot trust score has changed." },
  referral_reward:            { title: "Referral Reward Paid! 💎",         message: "You earned a referral reward for bringing someone to Circlepot." },
  // System — copy only, delivery is not routed via this webhook
  circle_payout:              { title: "Circle Payout",                    message: "A payout has been distributed." },
  circle_member_withdrew:     { title: "Member Withdrew",                  message: "A member made a withdrawal." },
  circle_contribution_self:   { title: "Contribution Made",                message: "Your contribution was recorded." },
  goal_milestone:             { title: "Goal Milestone",                   message: "You've hit a savings milestone!" },
  goal_reminder:              { title: "Goal Reminder",                    message: "Don't forget to contribute to your goal." },
  invite_accepted:            { title: "Invite Accepted",                  message: "Someone accepted your invite." },
  withdrawal_fee_applied:     { title: "Withdrawal Fee Applied",           message: "A fee was applied to your withdrawal." },
  system_maintenance:         { title: "Scheduled Maintenance",            message: "Circlepot will be briefly unavailable for maintenance." },
  system_update:              { title: "App Updated",                      message: "Circlepot has been updated with new features." },
  security_alert:             { title: "Security Alert 🔐",               message: "Action required on your account security." },
};

// ─── Extract the "affected user" from a log's topics + contract ───────────────
// This is a best-effort decode: we look at indexed address params in the events.
type AlchemyLog = {
  data: string;
  topics: string[];
  account: { address: string };
  transaction: { hash: string; from: { address: string }; to: { address: string }; status: string };
};

type AlchemyBlock = {
  hash: string;
  number: number;
  timestamp: number;
  logs: AlchemyLog[];
};

type AlchemyWebhookPayload = {
  event: {
    data: {
      block: AlchemyBlock;
    };
  };
};

/**
 * Extracts the wallet address(es) that should be notified for a given log.
 *
 * Strategy:
 *  - Most events have the affected member/recipient as an indexed address (topics[1] or topics[2]).
 *  - For "broadcast" events (like CircleStarted) we look up all members from MongoDB.
 */
async function resolveRecipients(
  log: AlchemyLog,
  eventType: NotificationType
): Promise<string[]> {
  const topics = log.topics;

  // Helper: decode a 32-byte topic as an address (last 20 bytes)
  const topicToAddr = (topic: string) =>
    "0x" + topic.slice(26).toLowerCase();

  // Events where the affected user is the transaction sender (topics[1] is circleId, not address)
  const senderIsRecipient: NotificationType[] = [
    "payment_received",
    "collateral_returned",
    "goal_completed",
    "goal_contribution_due",
  ];

  if (senderIsRecipient.includes(eventType)) {
    return [log.transaction.from.address.toLowerCase()];
  }

  // Events where topics[2] is the member/recipient address
  const memberAtTopic2: NotificationType[] = [
    "circle_joined",
    "circle_member_joined",
    "position_assigned",
    "member_forfeited",
    "collateral_returned",
    "late_payment_warning",
    "circle_invite",   // topics[3] = invitee
  ];

  if (eventType === "circle_invite" && topics[3]) {
    return [topicToAddr(topics[3])];
  }

  if (memberAtTopic2.includes(eventType) && topics[2]) {
    return [topicToAddr(topics[2])];
  }

  // Broadcast events: notify ALL members of the circle
  // CircleId is topics[1] for most CircleSavings events
  const broadcastEvents: NotificationType[] = [
    "circle_started",
    "circle_dead",
    "vote_required",
    "vote_executed",
    "circle_voting",
    "circle_member_contributed",
    "circle_member_payout",
  ];

  if (broadcastEvents.includes(eventType) && topics[1]) {
    try {
      const circleId = parseInt(topics[1], 16).toString();
      const db = await getDb();
      const profiles = await db
        .collection("profiles")
        .find({
          circleIds: circleId,
        })
        .toArray();

      if (profiles.length > 0) {
        return profiles
          .map((p) => p.walletAddress as string)
          .filter(Boolean)
          .map((addr) => addr.toLowerCase());
      }
    } catch {
      // Fall through to empty
    }
  }

  return [];
}

// ─── GET Handler — URL reachability check (Alchemy "Test URL" probe) ─────────
export async function GET() {
  return NextResponse.json({ ok: true, service: "Circlepot Webhook" });
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Security — verify Alchemy HMAC-SHA256 signature
    // Alchemy signs the raw body with your webhook signing key using HMAC-SHA256.
    // Header: x-alchemy-signature
    if (ALCHEMY_WEBHOOK_SECRET) {
      const rawBody = await req.text();
      const signature = req.headers.get("x-alchemy-signature") ?? "";
      const expected = createHmac("sha256", ALCHEMY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Re-parse body since we consumed the stream
      const body = JSON.parse(rawBody) as AlchemyWebhookPayload;
      return handleWebhookBody(body);
    }

    // No secret set — parse body directly (dev mode)
    const body = (await req.json()) as AlchemyWebhookPayload;
    return handleWebhookBody(body);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("Webhook error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

// ─── Shared handler (called after auth) ───────────────────────────────────────
async function handleWebhookBody(body: AlchemyWebhookPayload) {
  try {
    const block = body?.event?.data?.block;

    // Alchemy "Test URL" sends a ping with no logs — always return 200
    if (!block?.logs?.length) {
      return NextResponse.json({ ok: true, skipped: true, reason: "No logs in block" });
    }

    const results: { type: string; recipients: number; success: number }[] = [];

    for (const log of block.logs) {
      const topic0 = log.topics[0];
      if (!topic0) continue;

      const eventType = TOPIC_TO_NOTIFICATION[topic0];
      if (!eventType) continue;

      // Only process events from our known contracts
      const contractAddr = log.account.address.toLowerCase();
      if (contractAddr !== CIRCLE_CONTRACT && contractAddr !== PERSONAL_CONTRACT) {
        continue;
      }

      const copy = NOTIFICATION_COPY[eventType];
      const recipients = await resolveRecipients(log, eventType);

      if (!recipients.length) continue;

      const payload: BackendNotificationPayload = {
        title: copy.title,
        message: copy.message,
        type: eventType,
        priority:
          ["vote_required", "circle_dead", "payment_received", "member_forfeited"].includes(eventType)
            ? "high"
            : "medium",
        action: { action: "/" },
        data: {
          transactionHash: log.transaction.hash,
          topic0,
        },
        userAddresses: recipients,
      };

      const sendResults =
        recipients.length === 1
          ? [await sendPushNotification(recipients[0], payload)]
          : await sendPushNotificationToMany(recipients, payload);

      results.push({
        type: eventType,
        recipients: recipients.length,
        success: sendResults.filter((r) => r.success).length,
      });
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Internal server error";
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

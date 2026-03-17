import { NextRequest, NextResponse } from "next/server";
import { notifyUser } from "@/lib/notifications";
import { GraphQLClient, gql } from "graphql-request";
import crypto from "crypto";
import { decodeEventLog } from "viem";
import {
  CIRCLE_SAVINGS_ABI,
  PERSONAL_SAVINGS_ABI,
  REFERRAL_REWARDS_ABI,
} from "@/app/constants/abis";

const ALCHEMY_WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

interface CircleJoinedArgs {
  circleId: bigint;
  member: string;
}

interface CircleStartedArgs {
  circleId: bigint;
  startedAt: bigint;
  state: number;
  roundDeadline: bigint;
}

interface PayoutDistributedArgs {
  recipient: string;
  circleId: bigint;
  round: bigint;
  amount: bigint;
  token: string;
}

interface ContributionMadeArgs {
  member: string;
  circleId: bigint;
  round: bigint;
}

interface LateContributionMadeArgs {
  circleId: bigint;
  round: bigint;
  member: string;
  amount: bigint;
  fee: bigint;
  token: string;
}

interface MemberForfeitedArgs {
  circleId: bigint;
  round: bigint;
  member: string;
  deduction: bigint;
  forfeiter: string;
}

interface CollateralReturnedArgs {
  circleId: bigint;
  member: string;
  amount: bigint;
  token: string;
}

interface VotingInitiatedArgs {
  circleId: bigint;
  votingStartTime: bigint;
  votingEndTime: bigint;
}

interface VoteExecutedArgs {
  circleId: bigint;
  circleStarted: boolean;
  startVoteCount: bigint;
  withdrawVoteCount: bigint;
}


interface GoalWithdrawnArgs {
  goalId: bigint;
  owner: string;
  amount: bigint;
  penalty: bigint;
}

interface YieldDistributedArgs {
  goalId: bigint;
  owner: string;
  yieldAmount: bigint;
}

interface ReferralRewardPaidArgs {
  referrer: string;
}

// Contract addresses for filtering
const CIRCLE_SAVINGS_ADDRESS =
  process.env.NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT?.toLowerCase();
const PERSONAL_SAVINGS_ADDRESS =
  process.env.NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT?.toLowerCase();
const REFERRAL_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_REFERRAL_CONTRACT?.toLowerCase();

const client = SUBGRAPH_URL ? new GraphQLClient(SUBGRAPH_URL) : null;

/**
 * Verify Alchemy Webhook signature (HMAC-SHA256)
 */
function verifyAlchemySignature(req: NextRequest, body: string): boolean {
  if (!ALCHEMY_WEBHOOK_SECRET) return true;

  const signature = req.headers.get("x-alchemy-signature");
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", ALCHEMY_WEBHOOK_SECRET);
  const hash = hmac.update(body).digest("hex");

  return hash === signature;
}

interface SubgraphCircleMemberResponse {
  circle: {
    creator: { id: string };
    circlesJoined: Array<{
      user: { id: string };
    }>;
  } | null;
}

/**
 * Fetch all member addresses for a given circle from the Subgraph
 */
async function getCircleMembers(circleId: string): Promise<string[]> {
  if (!client) return [];

  const query = gql`
    query GetCircleMembers($circleId: String!) {
      circle(id: $circleId) {
        creator {
          id
        }
        circlesJoined {
          user {
            id
          }
        }
      }
    }
  `;

  try {
    const data = await client.request<SubgraphCircleMemberResponse>(query, {
      circleId,
    });
    if (!data.circle) return [];

    const members = new Set<string>();
    members.add(data.circle.creator.id.toLowerCase());

    data.circle.circlesJoined.forEach((cj) => {
      members.add(cj.user.id.toLowerCase());
    });

    return Array.from(members);
  } catch (error) {
    console.error("[Subgraph] Error fetching members:", error);
    return [];
  }
}

/**
 * Alchemy Webhook Payload Structure
 */
interface AlchemyWebhookLog {
  address?: string;
  account?: {
    address: string;
  };
  topics: string[];
  data: string;
  blockNumber?: string;
  transactionHash?: string;
  transaction?: {
    hash: string;
  };
}

interface AlchemyWebhookBody {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    data?: {
      block?: {
        logs: AlchemyWebhookLog[];
      };
    };
    // For ADDRESS_ACTIVITY type
    activity?: Array<{
      fromAddress: string;
      toAddress: string;
      hash: string;
      rawContract?: {
        address: string;
      };
      log?: AlchemyWebhookLog;
    }>;
  };
}

export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
    const body = JSON.parse(rawBody) as AlchemyWebhookBody;

    if (!verifyAlchemySignature(req, rawBody)) {
      console.error("WebhookAPI Invalid Alchemy signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract logs from different possible Alchemy payload formats
    let logs: AlchemyWebhookLog[] = [];

    if (body.type === "GRAPHQL" && body.event?.data?.block?.logs) {
      logs = body.event.data.block.logs;
    } else if (body.type === "ADDRESS_ACTIVITY" && body.event?.activity) {
      logs = body.event.activity
        .map((a) => a.log)
        .filter((l): l is AlchemyWebhookLog => !!l);
    }

    if (!body.event) {
      return NextResponse.json({
        status: "verified",
        message: "Webhook is alive",
      });
    }

    if (logs.length === 0) {
      return NextResponse.json({ status: "no_logs_processed" });
    }

    for (const log of logs) {
      const logAddress = (log.address || log.account?.address)?.toLowerCase();

      if (!logAddress) continue;

      try {
        let decoded;

        // 1. Identify which contract emitted the log and decode accordingly
        if (logAddress === CIRCLE_SAVINGS_ADDRESS) {
          decoded = decodeEventLog({
            abi: CIRCLE_SAVINGS_ABI,
            data: log.data as `0x${string}`,
            topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          });
        } else if (logAddress === PERSONAL_SAVINGS_ADDRESS) {
          decoded = decodeEventLog({
            abi: PERSONAL_SAVINGS_ABI,
            data: log.data as `0x${string}`,
            topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          });
        } else if (logAddress === REFERRAL_REWARDS_ADDRESS) {
          decoded = decodeEventLog({
            abi: REFERRAL_REWARDS_ABI,
            data: log.data as `0x${string}`,
            topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
          });
        }

        if (!decoded) continue;

        const { eventName, args } = decoded;

        // 2. Handle specific events
        switch (eventName) {
          case "CircleJoined": {
            const joinedArgs = args as unknown as CircleJoinedArgs;
            const circleId = joinedArgs.circleId?.toString();
            const member = joinedArgs.member;
            if (!circleId || !member) break;

            const members = await getCircleMembers(circleId);
            const others = members.filter((m) => m !== member.toLowerCase());

            await notifyUser(others, {
              title: "New Member! 👋",
              body: `A new member has joined your circle.`,
              url: "/savings?tab=group",

              type: "circle_member_joined",
            });
            break;
          }

          case "PayoutDistributed": {
            const payoutArgs = args as unknown as PayoutDistributedArgs;
            const recipient = payoutArgs.recipient;
            const circleId = payoutArgs.circleId?.toString();
            const round = payoutArgs.round?.toString();
            if (!recipient || !circleId || !round) break;

            // Notify the recipient
            await notifyUser(recipient, {
              title: "Payout Received! 💰",
              body: `You received a payout for round ${round}.`,
              url: "/savings?tab=group",
              type: "circle_payout",
            });

            // Notify other members
            const members = await getCircleMembers(circleId);
            const others = members.filter((m) => m !== recipient.toLowerCase());
            await notifyUser(others, {
              title: "Circle Payout Completed",
              body: `A payout was distributed for round ${round}.`,
              url: "/savings?tab=group",
              type: "circle_member_payout",
            });
            break;
          }

          case "ContributionMade": {
            const contArgs = args as unknown as ContributionMadeArgs;
            const member = contArgs.member;
            const circleId = contArgs.circleId?.toString();
            const round = contArgs.round?.toString();
            if (!member || !circleId || !round) break;

            const members = await getCircleMembers(circleId);
            const others = members.filter((m) => m !== member.toLowerCase());

            await notifyUser(others, {
              title: "Contribution Made ✅",
              body: `A member made their contribution for round ${round}.`,
              url: "/savings?tab=group",
              type: "circle_member_contributed",
            });
            break;
          }

          case "CircleStarted": {
            const startedArgs = args as unknown as CircleStartedArgs;
            const circleId = startedArgs.circleId?.toString();
            if (!circleId) break;

            const members = await getCircleMembers(circleId);
            await notifyUser(members, {
              title: "Circle ACTIVE! 🚀",
              body: `Your circle is now active. Contributions has started!`,
              url: "/savings?tab=group",
              type: "circle_started",
            });
            break;
          }

          case "VotingInitiated": {
            const voteArgs = args as unknown as VotingInitiatedArgs;
            const circleId = voteArgs.circleId?.toString();
            if (!circleId) break;

            const members = await getCircleMembers(circleId);
            await notifyUser(members, {
              title: "Vote Required! 🗳️",
              body: `A vote to start the circle has been initiated. Please cast your vote.`,
              url: "/savings?tab=group",
              type: "circle_voting",
            });
            break;
          }

          case "VoteExecuted": {
            const executedArgs = args as unknown as VoteExecutedArgs;
            const circleId = executedArgs.circleId?.toString();
            if (!circleId) break;

            const members = await getCircleMembers(circleId);
            const status = executedArgs.circleStarted ? "started" : "withdrawn";

            await notifyUser(members, {
              title: `Voting Result: ${status === "started" ? "Circle Started! ✅" : "Circle Withdrawn ⚠️"}`,
              body:
                status === "started"
                  ? "The vote passed and the circle is now active."
                  : "The vote result chose to withdraw. You can now withdraw your collateral.",
              url: "/savings?tab=group",
              type: "circle_voting",
            });
            break;
          }

          case "LateContributionMade": {
            const lateArgs = args as unknown as LateContributionMadeArgs;
            const member = lateArgs.member;
            const circleId = lateArgs.circleId?.toString();
            const round = lateArgs.round?.toString();
            if (!member || !circleId || !round) break;

            const members = await getCircleMembers(circleId);
            const others = members.filter((m) => m !== member.toLowerCase());

            await notifyUser(others, {
              title: "Late Payment Made ✅",
              body: `A member completed their late payment for round ${round}.`,
              url: "/savings?tab=group",
              type: "circle_member_contributed",
            });
            break;
          }

          case "MemberForfeited": {
            const forfeitArgs = args as unknown as MemberForfeitedArgs;
            const member = forfeitArgs.member;
            const circleId = forfeitArgs.circleId?.toString();
            if (!member || !circleId) break;

            const members = await getCircleMembers(circleId);
            await notifyUser(members, {
              title: "Member Forfeited ⚠️",
              body: `A member has forfeited and been removed from the circle.`,
              url: "/savings?tab=group",
              type: "member_forfeited",
            });
            break;
          }

          case "CollateralReturned": {
            const returnedArgs = args as unknown as CollateralReturnedArgs;
            const member = returnedArgs.member;
            const circleId = returnedArgs.circleId?.toString();
            if (!member || !circleId) break;

            await notifyUser(member, {
              title: "Collateral Returned! 💰",
              body: `Your collateral for circle #${circleId} has been returned to your wallet.`,
              url: "/savings?tab=group",
              type: "collateral_returned",
            });
            break;
          }

          case "GoalWithdrawn": {
            const withdrawArgs = args as unknown as GoalWithdrawnArgs;
            const owner = withdrawArgs.owner;
            const goalId = withdrawArgs.goalId?.toString();
            if (!owner || !goalId) break;

            await notifyUser(owner, {
              title: "Goal Withdrawal! 💸",
              body: `You have successfully withdrawn funds from your goal.`,
              url: "/savings?tab=personal",
              type: "goal_milestone",
            });
            break;
          }

          case "YieldDistributed": {
            const yieldArgs = args as unknown as YieldDistributedArgs;
            const owner = yieldArgs.owner;
            const goalId = yieldArgs.goalId?.toString();
            if (!owner || !goalId) break;

            await notifyUser(owner, {
              title: "Yield Earned! 📈",
              body: `You earned yield rewards on your savings goal.`,
              url: "/savings?tab=personal",
              type: "goal_milestone",
            });
            break;
          }

          case "ReferralRewardPaid": {
            const refArgs = args as unknown as ReferralRewardPaidArgs;
            const referrer = refArgs.referrer;
            if (!referrer) break;

            await notifyUser(referrer, {
              title: "Referral Bonus! 🎁",
              body: `You earned a reward for successfully referring a friend.`,
              url: "/profile",
              type: "referral_reward",
            });
            break;
          }
        }
      } catch (decodeError) {
        // Skip logs that don't match the ABI or fail to decode
        console.warn(
          `Webhook Failed to decode log at ${log.transactionHash}:`,
          decodeError,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("WebhookAPI Error:", errorMessage);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

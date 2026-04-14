import { NextRequest, NextResponse } from "next/server";
import { notifyUser } from "@/lib/notifications";
import { GraphQLClient, gql } from "graphql-request";
import crypto from "crypto";
import { decodeEventLog } from "viem";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import {
  CIRCLE_SAVINGS_ABI,
  PERSONAL_SAVINGS_ABI,
  REFERRAL_REWARDS_ABI,
} from "@/app/constants/abis";

const ALCHEMY_WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET;
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

// --- Interfaces for Event Decoding ---

interface CircleJoinedArgs {
  circleId: bigint;
  member: string;
}

interface CircleCreatedArgs {
  circleId: bigint;
  title: string;
  creator: string;
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
  amount?: bigint; // Optional in some versions of the event
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

interface CollateralWithdrawnArgs {
  circleId: bigint;
  member: string;
  amount: bigint;
  token: string;
}

interface MemberInvitedArgs {
  circleId: bigint;
  creator: string;
  invitee: string;
  invitedAt: bigint;
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
  referee: string;
  token: string;
  amount: bigint;
}

// --- Constants & Client ---

const CIRCLE_SAVINGS_ADDRESS =
  process.env.NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT?.toLowerCase();
const PERSONAL_SAVINGS_ADDRESS =
  process.env.NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT?.toLowerCase();
const REFERRAL_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_REFERRAL_CONTRACT?.toLowerCase();

const client = SUBGRAPH_URL ? new GraphQLClient(SUBGRAPH_URL) : null;

// --- Helper Functions ---

interface SubgraphCircleMetadataResponse {
  circles: Array<{
    circleName: string | null;
    creator: { id: string };
  }>;
  circleJoineds: Array<{
    user: { id: string };
  }>;
}

interface SubgraphGoalMetadataResponse {
  personalGoals: Array<{
    goalName: string | null;
  }>;
}

/**
 * Verify Alchemy Webhook signature
 */
function verifyAlchemySignature(req: NextRequest, body: string): boolean {
  if (!ALCHEMY_WEBHOOK_SECRET) return true;
  const signature = req.headers.get("x-alchemy-signature");
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", ALCHEMY_WEBHOOK_SECRET);
  const hash = hmac.update(body).digest("hex");
  return hash === signature;
}

/**
 * Resolve display name (First Name) from wallet address using MongoDB
 */
async function resolveDisplayName(address: string): Promise<string> {
  if (!address) return "Unknown User";
  const normalized = address.toLowerCase();
  try {
    const db = await getDb();
    const profile = await db
      .collection("profiles")
      .findOne(
        { walletAddress: normalized },
        { collation: { locale: "en", strength: 2 } },
      );

    if (profile?.firstName) {
      return profile.firstName.trim();
    }

    return `User ${normalized.slice(0, 6).toUpperCase()}...`;
  } catch {
    return `User ${normalized.slice(0, 6).toUpperCase()}...`;
  }
}

/**
 * Format USDT amount (6 decimals)
 */
function formatUSDT(amount: bigint): string {
  const decimals = 6;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 2);
  return `$${whole}.${fractionStr}`;
}

/**
 * Fetch Circle Metadata (Name & Members) from Subgraph
 */
async function getCircleMetadata(
  circleId: string,
): Promise<{ name: string; members: string[] }> {
  if (!client) {
    console.error("[Subgraph] Client not initialized");
    return { name: "your circle", members: [] };
  }

  const query = gql`
    query GetCircleMetadata($circleId: BigInt!) {
      circles(where: { circleId: $circleId }) {
        circleName
        creator {
          id
        }
      }
      circleJoineds(where: { circleId: $circleId }) {
        user {
          id
        }
      }
    }
  `;

  try {
    const data = await client.request<SubgraphCircleMetadataResponse>(query, {
      circleId: circleId.toString(),
    });

    const circle = data.circles?.[0];
    if (!circle) {
      // Fallback to local MongoDB cache (resolves race condition with subgraph indexing)
      try {
        const db = await getDb();
        const local = await db.collection("circles").findOne({ circleId });
        if (local) {
          const localMembers = local.members || (local.creator ? [local.creator.toLowerCase()] : []);
          return {
            name: local.title || "your circle",
            members: localMembers,
          };
        }
      } catch (err) {
        console.error("[MongoDB] Cache lookup failed:", err);
      }
      return { name: "your circle", members: [] };
    }

    const members = new Set<string>();
    if (circle.creator?.id) {
      members.add(circle.creator.id.toLowerCase());
    }

    if (data.circleJoineds) {
      data.circleJoineds.forEach((cj) => {
        if (cj.user?.id) {
          members.add(cj.user.id.toLowerCase());
        }
      });
    }

    const memberList = Array.from(members);

    return {
      name: circle.circleName || "your circle",
      members: memberList,
    };
  } catch (error) {
    console.error("[Subgraph] Error fetching circle metadata:", error);
    return { name: "your circle", members: [] };
  }
}

/**
 * Fetch Goal Metadata from Subgraph
 */
async function getGoalMetadata(goalId: string): Promise<string> {
  if (!client) return "your goal";

  const query = gql`
    query GetGoalMetadata($goalId: BigInt!) {
      personalGoals(where: { goalId: $goalId }) {
        goalName
      }
    }
  `;

  try {
    const data = await client.request<SubgraphGoalMetadataResponse>(query, {
      goalId: goalId.toString(),
    });
    return data.personalGoals?.[0]?.goalName || "your goal";
  } catch (error) {
    console.error("[Subgraph] Error fetching goal metadata:", error);
    return "your goal";
  }
}

// --- Webhook Payload Types ---

interface AlchemyWebhookLog {
  address?: string;
  account?: { address: string };
  topics: string[];
  data: string;
  transactionHash?: string;
  logIndex?: string;
  index?: number;
}

interface AlchemyWebhookBody {
  type: string;
  event: {
    data?: {
      block?: { logs: AlchemyWebhookLog[] };
    };
    activity?: Array<{
      log?: AlchemyWebhookLog;
      hash?: string;
    }>;
  };
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
  let rawBody = "";
  try {
    rawBody = await req.text();
    const body = JSON.parse(rawBody) as AlchemyWebhookBody;

    if (!verifyAlchemySignature(req, rawBody)) {
      console.error("WebhookAPI Invalid Alchemy signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let logs: AlchemyWebhookLog[] = [];
    if (body.type === "GRAPHQL" && body.event?.data?.block?.logs) {
      logs = body.event.data.block.logs;
    } else if (body.type === "ADDRESS_ACTIVITY" && body.event?.activity) {
      // Map address activity to logs, carrying over the transaction hash
      const activities = body.event.activity;
      logs = activities
        .filter((a) => !!a.log)
        .map((a) => ({
          ...a.log!,
          transactionHash: a.hash,
        }));
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

    await ensureIndexes();
    const db = await getDb();
    const processedCol = db.collection("processed_logs");

    for (const log of logs) {
      const logAddress = (log.address || log.account?.address)?.toLowerCase();
      if (!logAddress) continue;

      // DEDUPLICATION: transactionHash + logIndex/index + some data hash
      const txHash = log.transactionHash || "notx";
      const index = log.logIndex || log.index || "0";
      const logId = `${txHash}-${index}-${crypto
        .createHash("md5")
        .update(log.data || "")
        .digest("hex")
        .slice(0, 8)}`;

      const alreadyProcessed = await processedCol.findOne({ logId });
      if (alreadyProcessed) {
        continue;
      }

      try {
        let decoded;
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
        const eventName = decoded.eventName as string;
        const args = decoded.args;

        switch (eventName) {
          case "CircleCreated": {
            const createArgs = args as unknown as CircleCreatedArgs;
            const circleId = createArgs.circleId?.toString();
            if (circleId) {
              try {
                const db = await getDb();
                await db.collection("circles").updateOne(
                  { circleId },
                  {
                    $set: {
                      title: createArgs.title,
                      creator: createArgs.creator,
                      updatedAt: new Date(),
                    },
                    $addToSet: {
                      members: createArgs.creator.toLowerCase(),
                    },
                  },
                  { upsert: true },
                );
              } catch (err) {
                console.error("[MongoDB] Failed to cache circle:", err);
              }
            }
            break;
          }

          case "CircleJoined": {
            const joinedArgs = args as unknown as CircleJoinedArgs;
            const circleId = joinedArgs.circleId?.toString();
            const memberAddr = joinedArgs.member;

            if (!circleId || !memberAddr) {
              console.warn(
                "[Webhook] Missing circleId or memberAddr in CircleJoined event",
              );
              break;
            }

            try {
              const db = await getDb();
              await db.collection("circles").updateOne(
                { circleId },
                {
                  $addToSet: { members: memberAddr.toLowerCase() },
                  $set: { updatedAt: new Date() },
                },
                { upsert: true },
              );
            } catch (err) {
              console.error("[MongoDB] Failed to cache joined member:", err);
            }

            const [displayName, circle] = await Promise.all([
              resolveDisplayName(memberAddr),
              getCircleMetadata(circleId),
            ]);

            const others = circle.members.filter(
              (m) => m !== memberAddr.toLowerCase(),
            );

            if (others.length > 0) {
              await notifyUser(others, {
                title: "New Member Joined 👋",
                body: `${displayName} joined "${circle.name}"`,
                url: "/savings?tab=group",
                type: "circle_member_joined",
              });
            }
            break;
          }

          case "ContributionMade": {
            const contArgs = args as unknown as ContributionMadeArgs;
            const memberAddr = contArgs.member;
            const circleId = contArgs.circleId?.toString();
            const round = contArgs.round?.toString();
            if (!memberAddr || !circleId || !round) break;

            const [displayName, circle] = await Promise.all([
              resolveDisplayName(memberAddr),
              getCircleMetadata(circleId),
            ]);

            const others = circle.members.filter(
              (m) => m !== memberAddr.toLowerCase(),
            );
            await notifyUser(others, {
              title: "Circle Contribution Made ✅",
              body: `${displayName} has contributed to ${circle.name} for round ${round}`,
              url: "/savings?tab=group",
              type: "circle_member_contributed",
            });
            break;
          }

          case "LateContributionMade": {
            const lateArgs = args as unknown as LateContributionMadeArgs;
            const memberAddr = lateArgs.member;
            const circleId = lateArgs.circleId?.toString();
            const round = lateArgs.round?.toString();
            if (!memberAddr || !circleId || !round) break;

            const [displayName, circle] = await Promise.all([
              resolveDisplayName(memberAddr),
              getCircleMetadata(circleId),
            ]);

            const others = circle.members.filter(
              (m) => m !== memberAddr.toLowerCase(),
            );

            await notifyUser(others, {
              title: "Circle Contribution Made ✅",
              body: `${displayName} has made a late contribution to ${circle.name} for round ${round}`,
              url: "/savings?tab=group",
              type: "circle_member_contributed",
            });
            break;
          }

          case "PayoutDistributed": {
            const payoutArgs = args as unknown as PayoutDistributedArgs;
            const recipientAddr = payoutArgs.recipient;
            const circleId = payoutArgs.circleId?.toString();
            const round = payoutArgs.round?.toString();
            const amount = formatUSDT(payoutArgs.amount);
            if (!recipientAddr || !circleId || !round) break;

            const [recipientDisplayName, circle] = await Promise.all([
              resolveDisplayName(recipientAddr),
              getCircleMetadata(circleId),
            ]);

            // Notify recipient
            await notifyUser(recipientAddr, {
              title: "Payment Received! 💰",
              body: `You received ${amount} from "${circle.name}" payout (Round ${round})`,
              url: "/dashboard",
              type: "circle_payout",
            });

            // Notify others
            const others = circle.members.filter(
              (m) => m !== recipientAddr.toLowerCase(),
            );
            await notifyUser(others, {
              title: "Circle Payout Completed",
              body: `${recipientDisplayName} received their payout of ${amount} for "${circle.name}" circle (Round ${round})`,
              url: "/savings?tab=group",
              type: "circle_member_payout",
            });
            break;
          }

          case "CircleStarted": {
            const startedArgs = args as unknown as CircleStartedArgs;
            const circleId = startedArgs.circleId?.toString();
            if (!circleId) break;

            const circle = await getCircleMetadata(circleId);
            await notifyUser(circle.members, {
              title: "Members Completed",
              body: `Circle Started! 🚀`,
              url: "/savings?tab=group",
              type: "circle_started",
            });
            break;
          }

          case "VotingInitiated": {
            const voteArgs = args as unknown as VotingInitiatedArgs;
            const circleId = voteArgs.circleId?.toString();
            if (!circleId) break;

            const circle = await getCircleMetadata(circleId);
            const deadline = new Date(
              Number(voteArgs.votingEndTime) * 1000,
            ).toLocaleDateString();

            await notifyUser(circle.members, {
              title: "Vote Required! 🗳️",
              body: `Voting has started for your circle. Cast your vote before ${deadline}`,
              url: "/savings?tab=group",
              type: "vote_required",
            });
            break;
          }

          case "VoteExecuted": {
            const executedArgs = args as unknown as VoteExecutedArgs;
            const circleId = executedArgs.circleId?.toString();
            if (!circleId) break;

            const circle = await getCircleMetadata(circleId);
            const statusMessage = executedArgs.circleStarted
              ? "Circle Started! 🚀"
              : "Circle did not start";

            await notifyUser(circle.members, {
              title: "Voting Results",
              body: statusMessage,
              url: executedArgs.circleStarted
                ? "/savings?tab=group"
                : "/transactions-history",
              type: executedArgs.circleStarted
                ? "circle_started"
                : "vote_executed",
            });
            break;
          }

          case "MemberInvited": {
            const inviteArgs = args as unknown as MemberInvitedArgs;
            const circleId = inviteArgs.circleId?.toString();
            const inviterAddr = inviteArgs.creator;
            const inviteeAddr = inviteArgs.invitee;
            if (!circleId || !inviterAddr || !inviteeAddr) break;

            const [inviterDisplayName, circle] = await Promise.all([
              resolveDisplayName(inviterAddr),
              getCircleMetadata(circleId),
            ]);

            await notifyUser(inviteeAddr, {
              title: "Circle Invitation 📩",
              body: `${inviterDisplayName} invited you to join "${circle.name}"`,
              url: `/join/${circleId}`,
              type: "circle_invite",
            });
            break;
          }

          case "CollateralWithdrawn": {
            const withdrawnArgs = args as unknown as CollateralWithdrawnArgs;
            const memberAddr = withdrawnArgs.member;
            const circleId = withdrawnArgs.circleId?.toString();
            if (!memberAddr || !circleId) break;

            const [circle] = await Promise.all([getCircleMetadata(circleId)]);

            const others = circle.members.filter(
              (m) => m !== memberAddr.toLowerCase(),
            );
            await notifyUser(others, {
              title: "Member Withdrew",
              body: `All members got their collateral back from "${circle.name}"`,
              url: "/transactions-history",
              type: "circle_member_withdrew",
            });
            break;
          }

          case "MemberForfeited": {
            const forfeitArgs = args as unknown as MemberForfeitedArgs;
            const memberAddr = forfeitArgs.member;
            const circleId = forfeitArgs.circleId?.toString();
            const amount = formatUSDT(forfeitArgs.deduction);
            const round = forfeitArgs.round?.toString();
            if (!memberAddr || !circleId) break;

            const [forfeitedDisplayName, circle] = await Promise.all([
              resolveDisplayName(memberAddr),
              getCircleMetadata(circleId),
            ]);

            // Notify the forfeited user
            await notifyUser(memberAddr, {
              title: "You have been forfeited ⚠️",
              body: `You were forfeited from "${circle.name}". Deduction: ${amount} (Round ${round})`,
              url: "/transactions-history",
              type: "member_forfeited",
            });

            // Notify others
            const others = circle.members.filter(
              (m) => m !== memberAddr.toLowerCase(),
            );
            await notifyUser(others, {
              title: "Member Forfeited",
              body: `${forfeitedDisplayName} has been forfeited from "${circle.name}" (Round ${round})`,
              url: "/savings?tab=group",
              type: "member_forfeited",
            });
            break;
          }

          case "CollateralReturned": {
            const returnedArgs = args as unknown as CollateralReturnedArgs;
            const memberAddr = returnedArgs.member;
            const amount = formatUSDT(returnedArgs.amount);
            if (!memberAddr) break;

            await notifyUser(memberAddr, {
              title: "Collateral Returned 💵",
              body: `Your collateral of ${amount} has been returned`,
              url: "/transactions-history",
              type: "collateral_returned",
            });
            break;
          }

          // Goals
          case "GoalWithdrawn": {
            const withdrawArgs = args as unknown as GoalWithdrawnArgs;
            const ownerAddr = withdrawArgs.owner;
            const goalId = withdrawArgs.goalId?.toString();
            if (!ownerAddr || !goalId) break;

            const goalName = await getGoalMetadata(goalId);
            await notifyUser(ownerAddr, {
              title: "Goal Withdrawal! 💸",
              body: `You have successfully withdrawn funds from your goal "${goalName}".`,
              url: "/transactions-history",
              type: "goal_milestone",
            });
            break;
          }

          case "YieldDistributed": {
            const yieldArgs = args as unknown as YieldDistributedArgs;
            const ownerAddr = yieldArgs.owner;
            const goalId = yieldArgs.goalId?.toString();
            if (!ownerAddr || !goalId) break;

            const goalName = await getGoalMetadata(goalId);
            await notifyUser(ownerAddr, {
              title: "Yield Earned! 📈",
              body: `You earned yield rewards on your "${goalName}" savings goal.`,
              url: "/savings?tab=personal",
              type: "goal_milestone",
            });
            break;
          }

          case "ReferralRewardPaid": {
            const refArgs = args as unknown as ReferralRewardPaidArgs;
            const referrerAddr = refArgs.referrer;
            const amount = formatUSDT(refArgs.amount);
            if (!referrerAddr) break;

            const refereeDisplayName = await resolveDisplayName(
              refArgs.referee,
            );
            await notifyUser(referrerAddr, {
              title: "Referral Bonus! 🎁",
              body: `You just earned ${amount} because ${refereeDisplayName} joined Circlepot!`,
              url: "/profile",
              type: "referral_reward",
            });
            break;
          }
        }

        // Mark log as processed
        await processedCol.insertOne({
          logId,
          transactionHash: log.transactionHash,
          processedAt: new Date(),
        });
      } catch (decodeError) {
        console.warn(`[Webhook] Failed to process log ${logId}:`, decodeError);
      }
    }

    return NextResponse.json({ success: true, processed: logs.length });
  } catch (error: unknown) {
    const isTimeout =
      error instanceof Error && error.message.includes("ETIMEOUT");
    console.error(`[Webhook] Handler error:`, error);
    return NextResponse.json(
      { error: isTimeout ? "Database Timeout" : "Internal Server Error" },
      { status: isTimeout ? 503 : 500 },
    );
  }
}

import { getDb } from "@/lib/mongodb";
import { sendPushNotification } from "@/lib/webpush-service";

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
  type?: string;
}

/**
 * Send a notification to one or more user addresses.
 * Stores in history and attempts web push for all active subscriptions.
 */
export async function notifyUser(
  userAddresses: string | string[],
  payload: NotificationPayload,
) {
  const addresses = Array.isArray(userAddresses)
    ? userAddresses
    : [userAddresses];
  const db = await getDb();

  const results = [];

  try {
    for (const address of addresses) {
      const normalizedAddress = address.toLowerCase();

      // 1. Store in notification history collection
      await db.collection("notifications").insertOne({
        userAddress: normalizedAddress,
        title: payload.title,
        message: payload.body,
        url: payload.url || "/",
        type: payload.type || "system",
        read: false,
        createdAt: new Date(),
        data: payload.data || {},
      });

      // 2. Fetch and trigger web push subscriptions
      const subscriptions = await db
        .collection("subscriptions")
        .find({
          userAddress: normalizedAddress,
        })
        .toArray();

      if (subscriptions.length === 0) {
        results.push({
          address: normalizedAddress,
          pushSent: 0,
          pushFailed: 0,
        });
        continue;
      }

      // Parallelize push notifications for this user
      const pushPromises = subscriptions.map(async (sub) => {
        const result = await sendPushNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          {
            title: payload.title,
            body: payload.body,
            url: payload.url || "/",
            data: payload.data || {},
          },
        );

        if (!result.success && result.expired) {
          await db
            .collection("subscriptions")
            .deleteOne({ endpoint: sub.endpoint });
        }
        return result.success;
      });

      const pushResults = await Promise.all(pushPromises);
      const pushSent = pushResults.filter((r) => r).length;
      const pushFailed = pushResults.length - pushSent;

      results.push({ address: normalizedAddress, pushSent, pushFailed });
    }

    return results;
  } catch (error) {
    console.error("[Notifications] Error in notifyUser:", error);
    return results;
  }
}

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
  payload: NotificationPayload
) {
  const addresses = Array.isArray(userAddresses) ? userAddresses : [userAddresses];
  const db = await getDb();
  
  const results = [];

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
      data: payload.data || {}
    });

    // 2. Fetch and trigger web push subscriptions
    const subscriptions = await db.collection("subscriptions").find({ 
      userAddress: normalizedAddress 
    }).toArray();

    let pushSent = 0;
    let pushFailed = 0;

    for (const sub of subscriptions) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: sub.keys
      };
      
      const result = await sendPushNotification(pushSub, {
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        data: payload.data || {}
      });

      if (result.success) {
        pushSent++;
      } else {
        pushFailed++;
        // Cleanup expired/invalid subscriptions automatically
        if (result.expired) {
          await db.collection("subscriptions").deleteOne({ endpoint: sub.endpoint });
        }
      }
    }

    results.push({ address: normalizedAddress, pushSent, pushFailed });
  }

  return results;
}

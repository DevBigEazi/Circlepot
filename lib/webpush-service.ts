import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_MAILTO = process.env.VAPID_MAILTO || "mailto:team@circlepot.xyz";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Send a push notification to a specific subscription
 * @param subscription The user's push subscription
 * @param payload The notification content (title, body, url, etc.)
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: Record<string, unknown>;
  },
) {
  try {
    const stringifiedPayload = JSON.stringify(payload);
    await webpush.sendNotification(subscription, stringifiedPayload);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = (error as { statusCode?: number }).statusCode;

    console.error("[WebPush] Error sending notification:", errorMessage);

    // If the subscription is no longer valid, we should mark it for removal
    if (statusCode === 404 || statusCode === 410) {
      return { success: false, expired: true };
    }

    return { success: false, error: errorMessage };
  }
}

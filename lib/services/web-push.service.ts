import webpush from "web-push";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export function getPublicVapidKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

export async function sendWebPushToMany(
  subscriptions: StoredSubscription[],
  payload: PushPayload
) {
  if (!configureWebPush() || subscriptions.length === 0) {
    return { sent: 0, expiredEndpoints: [] as string[] };
  }

  const body = JSON.stringify(payload);
  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        return { ok: true as const, endpoint: sub.endpoint };
      } catch (error: unknown) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof (error as { statusCode?: unknown }).statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : undefined;
        const expired = statusCode === 404 || statusCode === 410;
        return { ok: false as const, endpoint: sub.endpoint, expired };
      }
    })
  );

  return {
    sent: results.filter((r) => r.ok).length,
    expiredEndpoints: results.filter((r) => !r.ok && r.expired).map((r) => r.endpoint),
  };
}

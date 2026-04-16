import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublicVapidKey } from "@/lib/services/web-push.service";

export const dynamic = "force-dynamic";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function getSellerId() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "VENDEDOR" ||
    !session.user.sellerId
  ) {
    return null;
  }
  return session.user.sellerId;
}

export async function GET() {
  const sellerId = await getSellerId();
  if (!sellerId) return unauthorized();
  return NextResponse.json({ publicKey: getPublicVapidKey() });
}

export async function POST(req: Request) {
  const sellerId = await getSellerId();
  if (!sellerId) return unauthorized();

  const body = (await req.json()) as PushSubscriptionBody;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const authKey = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      sellerId,
      p256dh,
      auth: authKey,
      userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    },
    create: {
      sellerId,
      endpoint,
      p256dh,
      auth: authKey,
      userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const sellerId = await getSellerId();
  if (!sellerId) return unauthorized();

  const body = (await req.json()) as { endpoint?: string };
  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint obrigatório" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { sellerId, endpoint } });
  return NextResponse.json({ ok: true });
}

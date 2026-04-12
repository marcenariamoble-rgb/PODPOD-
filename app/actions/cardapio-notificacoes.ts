"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || role === "VENDEDOR") {
    throw new Error("Sem permissão.");
  }
}

/** Ativa ou desativa notificações de pedido do cardápio para um vendedor. */
export async function actionDefinirAlertaCardapioVendedor(formData: FormData) {
  await requireStaff();
  const sellerId = String(formData.get("sellerId") ?? "").trim();
  const ativo = String(formData.get("ativo") ?? "") === "true";
  if (!sellerId) return;

  const exists = await prisma.seller.findFirst({
    where: { id: sellerId, ativo: true },
    select: { id: true },
  });
  if (!exists) return;

  if (ativo) {
    await prisma.cardapioAlertaVendedor.upsert({
      where: { sellerId },
      create: { sellerId },
      update: {},
    });
  } else {
    await prisma.cardapioAlertaVendedor.deleteMany({ where: { sellerId } });
  }

  revalidatePath("/pedidos-cardapio/alertas");
  revalidatePath("/pedidos-cardapio");
}

export async function actionMarcarNotificacaoCardapioLida(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "VENDEDOR" || !session.user.sellerId) {
    throw new Error("Sem permissão.");
  }
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const n = await prisma.notificacaoSolicitacaoCardapio.findFirst({
    where: { id, sellerId: session.user.sellerId },
    select: { id: true },
  });
  if (!n) return;

  await prisma.notificacaoSolicitacaoCardapio.update({
    where: { id },
    data: { lida: true },
  });

  revalidatePath("/vendedor");
  revalidatePath("/vendedor/pedidos-cardapio");
}

export async function actionMarcarTodasNotificacoesCardapioLidas() {
  const session = await auth();
  if (session?.user?.role !== "VENDEDOR" || !session.user.sellerId) {
    throw new Error("Sem permissão.");
  }
  await prisma.notificacaoSolicitacaoCardapio.updateMany({
    where: { sellerId: session.user.sellerId, lida: false },
    data: { lida: true },
  });
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/pedidos-cardapio");
}

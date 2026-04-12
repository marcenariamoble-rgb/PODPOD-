"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

/** Evita crash se o cliente Prisma em memória estiver desatualizado (correr `npx prisma generate` e reiniciar o `next dev`). */
async function notificarVendedoresPedidoCardapio(
  db: PrismaClient,
  solicitacaoCardapioId: string
) {
  const ext = db as unknown as {
    cardapioAlertaVendedor?: {
      findMany: (args: {
        select: { sellerId: true };
      }) => Promise<{ sellerId: string }[]>;
    };
    notificacaoSolicitacaoCardapio?: {
      createMany: (args: {
        data: { solicitacaoCardapioId: string; sellerId: string }[];
        skipDuplicates?: boolean;
      }) => Promise<unknown>;
    };
  };
  if (!ext.cardapioAlertaVendedor || !ext.notificacaoSolicitacaoCardapio) return;

  const destinos = await ext.cardapioAlertaVendedor.findMany({
    select: { sellerId: true },
  });
  if (destinos.length === 0) return;
  await ext.notificacaoSolicitacaoCardapio.createMany({
    data: destinos.map((d) => ({
      solicitacaoCardapioId,
      sellerId: d.sellerId,
    })),
    skipDuplicates: true,
  });
}

export type PedirCardapioResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function actionPedirCardapio(
  _prev: PedirCardapioResult | undefined,
  formData: FormData
): Promise<PedirCardapioResult> {
  const productId = String(formData.get("productId") ?? "").trim();
  const quantidadeRaw = Number(formData.get("quantidade") ?? 1);
  const nomeContato = String(formData.get("nomeContato") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  if (!productId) {
    return { ok: false, message: "Produto inválido." };
  }

  const quantidade = Math.min(
    99,
    Math.max(1, Number.isFinite(quantidadeRaw) ? Math.floor(quantidadeRaw) : 1)
  );

  if (!nomeContato && !telefone) {
    return {
      ok: false,
      message: "Informe pelo menos o nome ou o telefone para contacto.",
    };
  }

  const prod = await prisma.product.findFirst({
    where: { id: productId, ativo: true },
    select: { id: true },
  });
  if (!prod) {
    return { ok: false, message: "Este produto não está disponível no cardápio." };
  }

  const criada = await prisma.solicitacaoCardapio.create({
    data: {
      productId,
      quantidade,
      nomeContato: nomeContato || null,
      telefone: telefone || null,
      observacoes: observacoes || null,
    },
    select: { id: true },
  });

  await notificarVendedoresPedidoCardapio(prisma, criada.id);

  revalidatePath("/pedidos-cardapio");
  revalidatePath("/pedidos-cardapio/alertas");
  revalidatePath("/dashboard");
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/pedidos-cardapio");

  return {
    ok: true,
    message: "Pedido enviado. A equipa vai ver o alerta no painel.",
  };
}

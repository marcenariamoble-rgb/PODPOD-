"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { resolveCodigoIndicacaoPedido } from "@/lib/utils/codigo-indicacao";
import { sendWebPushToMany } from "@/lib/services/web-push.service";

async function notificarVendedoresPedidoCardapio(
  solicitacaoCardapioId: string,
  codigoIndicacao: string | null
) {
  const codigo = codigoIndicacao;

  if (codigo) {
    const direct = await prisma.seller.findFirst({
      where: {
        codigoVenda: codigo,
        ativo: true,
        user: { is: { role: Role.VENDEDOR, ativo: true } },
      },
      select: { id: true },
    });
    if (direct) {
      await prisma.notificacaoSolicitacaoCardapio.createMany({
        data: [{ solicitacaoCardapioId, sellerId: direct.id }],
        skipDuplicates: true,
      });
      return;
    }
  }

  const destinosConfigurados = await prisma.cardapioAlertaVendedor.findMany({
    where: {
      seller: {
        ativo: true,
        user: { is: { role: Role.VENDEDOR, ativo: true } },
      },
    },
    select: { sellerId: true },
  });

  // Resiliência: se ninguém estiver configurado, notifica todos os vendedores com login ativo.
  const destinos =
    destinosConfigurados.length > 0
      ? destinosConfigurados
      : await prisma.seller.findMany({
          where: {
            ativo: true,
            user: { is: { role: Role.VENDEDOR, ativo: true } },
          },
          select: { id: true },
        }).then((rows) => rows.map((r) => ({ sellerId: r.id })));

  if (destinos.length === 0) return;
  await prisma.notificacaoSolicitacaoCardapio.createMany({
    data: destinos.map((d) => ({
      solicitacaoCardapioId,
      sellerId: d.sellerId,
    })),
    skipDuplicates: true,
  });
}

async function enviarPushPedidoCardapio(params: {
  solicitacaoCardapioId: string;
  productId: string;
  quantidade: number;
}) {
  const solicitacao = await prisma.solicitacaoCardapio.findUnique({
    where: { id: params.solicitacaoCardapioId },
    select: {
      nomeContato: true,
      notificacoesVendedor: {
        select: {
          seller: {
            select: {
              pushSubscriptions: {
                select: { endpoint: true, p256dh: true, auth: true },
              },
            },
          },
        },
      },
    },
  });
  if (!solicitacao) return;

  const produto = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { nome: true },
  });

  const allSubs = solicitacao.notificacoesVendedor.flatMap((n) => n.seller.pushSubscriptions);
  if (allSubs.length === 0) return;

  const { expiredEndpoints } = await sendWebPushToMany(allSubs, {
    title: "PodPod — novo pedido no cardápio",
    body: `${produto?.nome ?? "Produto"} · ${params.quantidade} un.${
      solicitacao.nomeContato ? ` · ${solicitacao.nomeContato}` : ""
    }`,
    url: "/vendedor/pedidos-cardapio",
    tag: "podpod-cardapio-pedido",
  });

  if (expiredEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }
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
  const codigoIndicacao = resolveCodigoIndicacaoPedido(
    String(formData.get("codigoIndicacao") ?? "")
  );

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
    select: {
      id: true,
      estoqueCentral: true,
      sellerStocks: {
        where: { quantidade: { gt: 0 } },
        select: { quantidade: true },
      },
    },
  });
  if (!prod) {
    return { ok: false, message: "Este produto não está disponível no cardápio." };
  }
  const estoqueDisponivel =
    prod.estoqueCentral + prod.sellerStocks.reduce((acc, s) => acc + s.quantidade, 0);
  if (estoqueDisponivel < 1) {
    return {
      ok: false,
      message:
        "Este produto não tem stock disponível neste momento (depósito + comodato).",
    };
  }
  if (quantidade > estoqueDisponivel) {
    return {
      ok: false,
      message: `Quantidade acima do disponível (máx. ${estoqueDisponivel} un.).`,
    };
  }

  const criada = await prisma.solicitacaoCardapio.create({
    data: {
      productId,
      quantidade,
      nomeContato: nomeContato || null,
      telefone: telefone || null,
      observacoes: observacoes || null,
      codigoIndicacao,
    },
    select: { id: true },
  });

  await notificarVendedoresPedidoCardapio(criada.id, codigoIndicacao);
  await enviarPushPedidoCardapio({
    solicitacaoCardapioId: criada.id,
    productId,
    quantidade,
  });

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

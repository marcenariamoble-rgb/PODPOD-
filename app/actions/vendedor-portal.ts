"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  registrarConsumoProprioVendedor,
  registrarDevolucao,
  registrarVenda,
} from "@/lib/services/estoque.service";

function withParam(path: string, key: string, value: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}`;
}

async function assertVendedorSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  if (session.user.role !== "VENDEDOR" || !session.user.sellerId) {
    throw new Error("Acesso exclusivo do app vendedor.");
  }
  return {
    userId: session.user.id,
    sellerId: session.user.sellerId,
  };
}

export async function actionVendaPortal(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/vendedor/vender").trim() ||
    "/vendedor/vender";
  const { userId, sellerId } = await assertVendedorSession();
  const formaPagamento = String(formData.get("formaPagamento") ?? "") || undefined;
  const observacoes = String(formData.get("observacoes") ?? "") || undefined;
  const produtos = formData.getAll("productId").map((v) => String(v ?? "").trim());
  const quantidades = formData
    .getAll("quantidade")
    .map((v) => Math.floor(Number(v)))
    .map((n) => (Number.isFinite(n) ? n : 0));
  const valores = formData
    .getAll("valorUnitario")
    .map((v) => Number(String(v ?? "").replace(",", ".")))
    .map((n) => (Number.isFinite(n) ? n : NaN));

  const itens = produtos
    .map((productId, i) => ({
      productId,
      quantidade: quantidades[i] ?? 0,
      valorUnitario: valores[i] ?? NaN,
    }))
    .filter((i) => i.productId && i.quantidade > 0);

  if (itens.length === 0) {
    redirect(withParam(redirectAfter, "error", "Informe ao menos um item para venda."));
  }

  try {
    for (let i = 0; i < itens.length; i += 1) {
      const item = itens[i];
      await registrarVenda({
        vendedorId: sellerId,
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        formaPagamento,
        observacoes: observacoes ? `[Lote ${i + 1}] ${observacoes}` : undefined,
        usuarioId: userId,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível registrar a venda em lote.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendedor/vender");
  revalidatePath("/vendas");
  revalidatePath("/financeiro");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionDevolucaoPortal(formData: FormData) {
  const { userId, sellerId } = await assertVendedorSession();
  await registrarDevolucao({
    vendedorId: sellerId,
    productId: String(formData.get("productId") ?? ""),
    quantidade: Number(formData.get("quantidade")),
    observacoes: String(formData.get("observacoes") ?? "") || undefined,
    usuarioId: userId,
  });
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendedor/devolver");
  // A devolução também altera o estoque central (visões administrativas e cardápio).
  revalidatePath("/dashboard");
  revalidatePath("/produtos");
  revalidatePath("/movimentacoes");
  revalidatePath("/comodato/estoque");
  revalidatePath("/comodato/operacoes");
  revalidatePath("/cardapio");
}

export async function actionConsumoProprioPortal(formData: FormData) {
  const redirectAfter =
    String(formData.get("redirectAfter") ?? "/vendedor/consumo-proprio").trim() ||
    "/vendedor/consumo-proprio";
  const { userId, sellerId } = await assertVendedorSession();
  try {
    await registrarConsumoProprioVendedor({
      vendedorId: sellerId,
      productId: String(formData.get("productId") ?? ""),
      quantidade: Number(formData.get("quantidade")),
      observacoes: String(formData.get("observacoes") ?? "") || undefined,
      usuarioId: userId,
    });
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Não foi possível registrar o consumo próprio.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendedor/consumo-proprio");
  revalidatePath("/vendas");
  revalidatePath("/financeiro");
  redirect(withParam(redirectAfter, "ok", "1"));
}

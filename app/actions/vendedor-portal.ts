"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  registrarConsumoProprioVendedor,
  registrarDevolucao,
  registrarVendaLote,
} from "@/lib/services/estoque.service";

function withParam(path: string, key: string, value: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(value)}`;
}

function parsePositiveInt(raw: FormDataEntryValue | null): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
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
    .map((v) => {
      const raw = String(v ?? "").trim().replace(",", ".");
      if (raw === "") return Number.NaN;
      return Number(raw);
    })
    .map((n) => (Number.isFinite(n) ? n : NaN));

  const itens = produtos
    .map((productId, i) => ({
      productId,
      quantidade: quantidades[i] ?? 0,
      valorUnitario: valores[i] ?? NaN,
    }))
    .filter((i) => i.productId && i.quantidade > 0);

  if (itens.some((i) => !Number.isFinite(i.valorUnitario))) {
    redirect(
      withParam(
        redirectAfter,
        "error",
        "Informe o valor unitário para todos os itens preenchidos."
      )
    );
  }
  if (itens.some((i) => i.valorUnitario < 0)) {
    redirect(withParam(redirectAfter, "error", "Valor unitário não pode ser negativo."));
  }

  if (itens.length === 0) {
    redirect(withParam(redirectAfter, "error", "Informe ao menos um item para venda."));
  }

  try {
    await registrarVendaLote({
      vendedorId: sellerId,
      itens: itens.map((item, i) => ({
        productId: item.productId,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        formaPagamento,
        observacoes: observacoes ? `[Lote ${i + 1}] ${observacoes}` : undefined,
      })),
      usuarioId: userId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Não foi possível registrar a venda em lote.";
    redirect(withParam(redirectAfter, "error", msg));
  }
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendedor/vender");
  revalidatePath("/vendas");
  revalidatePath("/financeiro");
  revalidatePath("/cardapio");
  redirect(withParam(redirectAfter, "ok", "1"));
}

export async function actionDevolucaoPortal(formData: FormData) {
  const { userId, sellerId } = await assertVendedorSession();
  await registrarDevolucao({
    vendedorId: sellerId,
    productId: String(formData.get("productId") ?? ""),
    quantidade: parsePositiveInt(formData.get("quantidade")),
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
      quantidade: parsePositiveInt(formData.get("quantidade")),
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
  revalidatePath("/cardapio");
  redirect(withParam(redirectAfter, "ok", "1"));
}

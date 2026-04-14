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
  const { userId, sellerId } = await assertVendedorSession();
  await registrarVenda({
    vendedorId: sellerId,
    productId: String(formData.get("productId") ?? ""),
    quantidade: Number(formData.get("quantidade")),
    valorUnitario: Number(formData.get("valorUnitario")),
    formaPagamento: String(formData.get("formaPagamento") ?? "") || undefined,
    observacoes: String(formData.get("observacoes") ?? "") || undefined,
    usuarioId: userId,
  });
  revalidatePath("/vendedor");
  revalidatePath("/vendedor/estoque");
  revalidatePath("/vendedor/vender");
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

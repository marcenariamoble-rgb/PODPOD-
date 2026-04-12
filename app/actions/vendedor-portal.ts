"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { registrarDevolucao, registrarVenda } from "@/lib/services/estoque.service";

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
}

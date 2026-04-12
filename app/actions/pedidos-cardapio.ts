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

export async function actionMarcarPedidoCardapioVisualizado(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await prisma.solicitacaoCardapio.update({
    where: { id },
    data: { visualizado: true },
  });
  revalidatePath("/pedidos-cardapio");
  revalidatePath("/dashboard");
}

export async function actionMarcarTodosPedidosCardapioVisualizados() {
  await requireStaff();
  await prisma.solicitacaoCardapio.updateMany({
    where: { visualizado: false },
    data: { visualizado: true },
  });
  revalidatePath("/pedidos-cardapio");
  revalidatePath("/dashboard");
}

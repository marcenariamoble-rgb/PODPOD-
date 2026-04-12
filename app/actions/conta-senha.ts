"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function actionAlterarMinhaSenha(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Sessão expirada. Entre novamente." };
  }

  const atual = String(formData.get("senhaAtual") ?? "");
  const nova = String(formData.get("novaSenha") ?? "");
  const confirma = String(formData.get("confirmarSenha") ?? "");

  if (nova.length < 8) {
    return { ok: false, message: "A nova senha deve ter pelo menos 8 caracteres." };
  }
  if (nova !== confirma) {
    return { ok: false, message: "A confirmação não coincide com a nova senha." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { senhaHash: true },
  });
  if (!user) {
    return { ok: false, message: "Utilizador não encontrado." };
  }

  const ok = await bcrypt.compare(atual, user.senhaHash);
  if (!ok) {
    return { ok: false, message: "Senha atual incorreta." };
  }

  const senhaHash = await bcrypt.hash(nova, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { senhaHash },
  });

  revalidatePath("/conta/senha");
  revalidatePath("/vendedor/conta/senha");
  return { ok: true, message: "Senha alterada com sucesso." };
}

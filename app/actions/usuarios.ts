"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "VENDEDOR") {
    throw new Error("Sem permissão.");
  }
  return session;
}

function parseRole(raw: string): Role | null {
  if (raw === "ADMIN" || raw === "OPERADOR" || raw === "VENDEDOR") return raw as Role;
  return null;
}

export async function actionCreateUsuario(formData: FormData) {
  await requireStaff();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const role = parseRole(String(formData.get("role") ?? ""));
  const sellerIdRaw = String(formData.get("sellerId") ?? "").trim();

  if (!nome || !email || !role) {
    redirect(
      `/usuarios/novo?error=${encodeURIComponent("Preencha nome, e-mail e perfil.")}`
    );
  }
  if (senha.length < 8) {
    redirect(
      `/usuarios/novo?error=${encodeURIComponent("Senha inicial: mínimo 8 caracteres.")}`
    );
  }

  let sellerId: string | null = null;
  if (role === "VENDEDOR") {
    if (!sellerIdRaw) {
      redirect(
        `/usuarios/novo?error=${encodeURIComponent("Selecione o vendedor (cadastro) para perfil vendedor.")}`
      );
    }
    const s = await prisma.seller.findFirst({
      where: { id: sellerIdRaw, ativo: true },
      select: { id: true },
    });
    if (!s) {
      redirect(`/usuarios/novo?error=${encodeURIComponent("Vendedor inválido.")}`);
    }
    const taken = await prisma.user.findFirst({
      where: { sellerId: s.id },
      select: { id: true },
    });
    if (taken) {
      redirect(
        `/usuarios/novo?error=${encodeURIComponent("Este vendedor já tem utilizador ligado.")}`
      );
    }
    sellerId = s.id;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  try {
    await prisma.user.create({
      data: {
        nome,
        email,
        senhaHash,
        role,
        sellerId,
        ativo: true,
      },
    });
  } catch {
    redirect(
      `/usuarios/novo?error=${encodeURIComponent("Não foi possível criar (e-mail duplicado?).")}`
    );
  }
  revalidatePath("/usuarios");
  redirect("/usuarios?created=1");
}

export async function actionAtualizarUsuario(formData: FormData) {
  const session = await requireStaff();
  const id = String(formData.get("id") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = parseRole(String(formData.get("role") ?? ""));
  const ativo = String(formData.get("ativo") ?? "") === "true";
  const sellerIdRaw = String(formData.get("sellerId") ?? "").trim();

  if (!id || !nome || !email || !role) {
    redirect(`/usuarios?error=${encodeURIComponent("Dados inválidos.")}`);
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, sellerId: true },
  });
  if (!existing) {
    redirect(`/usuarios?error=${encodeURIComponent("Utilizador não encontrado.")}`);
  }

  if (id === session.user.id && !ativo) {
    redirect(
      `/usuarios/${id}?error=${encodeURIComponent("Não pode desativar a sua própria conta.")}`
    );
  }

  let sellerId: string | null = null;
  if (role === "VENDEDOR") {
    if (!sellerIdRaw) {
      redirect(
        `/usuarios/${id}?error=${encodeURIComponent("Selecione o vendedor para este perfil.")}`
      );
    }
    const s = await prisma.seller.findFirst({
      where: { id: sellerIdRaw, ativo: true },
      select: { id: true },
    });
    if (!s) {
      redirect(`/usuarios/${id}?error=${encodeURIComponent("Vendedor inválido.")}`);
    }
    const other = await prisma.user.findFirst({
      where: { sellerId: s.id, NOT: { id } },
      select: { id: true },
    });
    if (other) {
      redirect(
        `/usuarios/${id}?error=${encodeURIComponent("Este vendedor já tem outro utilizador.")}`
      );
    }
    sellerId = s.id;
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        nome,
        email,
        role,
        ativo,
        sellerId: role === "VENDEDOR" ? sellerId : null,
      },
    });
  } catch {
    redirect(
      `/usuarios/${id}?error=${encodeURIComponent("Não foi possível guardar (e-mail em uso?).")}`
    );
  }
  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${id}`);
  redirect(`/usuarios/${id}?saved=1`);
}

export async function actionAdminDefinirSenha(formData: FormData) {
  await requireStaff();
  const userId = String(formData.get("userId") ?? "").trim();
  const nova = String(formData.get("novaSenha") ?? "");
  const confirma = String(formData.get("confirmarSenha") ?? "");

  if (!userId || nova.length < 8 || nova !== confirma) {
    redirect(
      `/usuarios/${userId}?error=${encodeURIComponent("Senha: mínimo 8 caracteres e confirmação igual.")}`
    );
  }

  const senhaHash = await bcrypt.hash(nova, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { senhaHash },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  revalidatePath("/usuarios");
  revalidatePath(`/usuarios/${userId}`);
  redirect(`/usuarios/${userId}?password=1`);
}

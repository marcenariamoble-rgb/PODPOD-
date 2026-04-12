"use server";

import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import {
  generatePasswordResetSecret,
  hashPasswordResetToken,
} from "@/lib/password-reset-token";
import bcrypt from "bcryptjs";

const RESET_TTL_MS = 60 * 60 * 1000;

/** Mensagem única (não revela se o e-mail existe). */
const GENERIC_REQUEST_MSG =
  "Se existir uma conta com esse e-mail, enviaremos instruções para redefinir a senha.";

export async function actionSolicitarRedefinicaoSenha(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, message: "Informe o e-mail." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, nome: true, ativo: true, email: true },
  });

  if (!user?.ativo) {
    return { ok: true, message: GENERIC_REQUEST_MSG };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const { raw, tokenHash } = generatePasswordResetSecret();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const base =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "";
  if (base) {
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(raw)}`;
    const { ok } = await sendPasswordResetEmail(user.email, resetUrl, user.nome);
    if (!ok) {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      return {
        ok: false,
        message:
          "Não foi possível enviar o e-mail agora. Peça a um administrador para redefinir a senha ou configure RESEND_API_KEY e EMAIL_FROM.",
      };
    }
  } else {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    return {
      ok: false,
      message:
        "Defina AUTH_URL no ambiente para gerar o link de recuperação, ou peça a um administrador.",
    };
  }

  return { ok: true, message: GENERIC_REQUEST_MSG };
}

export async function actionRedefinirSenhaComToken(
  _prev: { ok: boolean; message: string } | undefined,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const token = String(formData.get("token") ?? "").trim();
  const nova = String(formData.get("novaSenha") ?? "");
  const confirma = String(formData.get("confirmarSenha") ?? "");

  if (!token || nova.length < 8) {
    return {
      ok: false,
      message: "Token inválido ou senha muito curta (mínimo 8 caracteres).",
    };
  }
  if (nova !== confirma) {
    return { ok: false, message: "As senhas não coincidem." };
  }

  const tokenHash = hashPasswordResetToken(token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, ativo: true } } },
  });

  if (!row || row.expiresAt < new Date() || !row.user.ativo) {
    return {
      ok: false,
      message: "Link inválido ou expirado. Solicite um novo em «Esqueci a senha».",
    };
  }

  const senhaHash = await bcrypt.hash(nova, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { senhaHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return { ok: true, message: "Senha atualizada. Já pode entrar com a nova senha." };
}

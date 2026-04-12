/**
 * Envio opcional via Resend (https://resend.com).
 * Defina RESEND_API_KEY e EMAIL_FROM na Vercel / .env
 * (ex.: EMAIL_FROM="PodPod <onboarding@resend.dev>").
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  nome: string
): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    return { ok: false };
  }
  const safeName = nome.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "PodPod — redefinir senha",
      html: `<p>Olá, ${safeName}.</p>
<p><a href="${resetUrl}">Criar nova senha</a></p>
<p>Se não pediu isto, ignore o e-mail. O link expira em 1 hora.</p>`,
    }),
  });
  return { ok: res.ok };
}

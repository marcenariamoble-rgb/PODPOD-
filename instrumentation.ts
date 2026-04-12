import { PHASE_PRODUCTION_BUILD } from "next/constants";

/** Falha ao arrancar o servidor em produção se variáveis críticas estiverem em falta. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;
  if (process.env.NODE_ENV !== "production") return;
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET é obrigatório em produção. Defina a variável no ambiente (ex.: Vercel → Settings → Environment Variables)."
    );
  }
}

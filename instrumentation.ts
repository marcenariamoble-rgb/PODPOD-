import { PHASE_PRODUCTION_BUILD } from "next/constants";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    if (
      process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD &&
      process.env.NODE_ENV === "production"
    ) {
      const secret = process.env.AUTH_SECRET?.trim();
      if (!secret) {
        throw new Error(
          "AUTH_SECRET é obrigatório em produção. Defina a variável no ambiente (ex.: Vercel → Settings → Environment Variables)."
        );
      }
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

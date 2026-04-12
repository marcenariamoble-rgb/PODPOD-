import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Instância só para o middleware (Edge): mesma config JWT/session que `lib/auth.ts`,
 * mas **sem** Prisma/bcrypt — importar `lib/auth.ts` no middleware quebra a leitura
 * da sessão na Vercel e gera loop de redirect (/login ↔ /dashboard).
 */
export const { auth } = NextAuth(authConfig);

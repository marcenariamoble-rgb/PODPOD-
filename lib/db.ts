import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Em desenvolvimento esta instância é reutilizada até reiniciar o `next dev`.
 * Depois de `prisma generate` ou alterações ao schema, **reinicie o servidor**
 * para carregar o cliente Prisma atualizado (novos modelos/campos). */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

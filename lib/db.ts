import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL não está definida.");
}

const adapter = new PrismaPg(new Pool({ connectionString }));

/** Em desenvolvimento esta instância é reutilizada até reiniciar o `next dev`.
 * Depois de `prisma generate` ou alterações ao schema, **reinicie o servidor**
 * para carregar o cliente Prisma atualizado (novos modelos/campos). */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

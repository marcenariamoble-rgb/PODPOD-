import { prisma } from "@/lib/db";

/** Linhas de estoque em posse dos vendedores (comodato instalado), quantidade maior que zero. */
export async function listComodatoInstalado(vendedorId?: string | null) {
  return prisma.sellerProductStock.findMany({
    where: {
      quantidade: { gt: 0 },
      ...(vendedorId ? { sellerId: vendedorId } : {}),
    },
    include: { seller: true, product: true },
    orderBy: [{ seller: { nome: "asc" } }, { product: { nome: "asc" } }],
  });
}

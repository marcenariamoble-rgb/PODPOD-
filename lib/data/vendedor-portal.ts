import { prisma } from "@/lib/db";
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";

export async function getVendedorPortalResumo(sellerId: string) {
  const [seller, stocks, fin] = await Promise.all([
    prisma.seller.findUnique({
      where: { id: sellerId },
      select: { id: true, nome: true, cidade: true, ativo: true, codigoVenda: true },
    }),
    prisma.sellerProductStock.findMany({
      where: { sellerId, quantidade: { gt: 0 } },
      include: {
        product: {
          select: { id: true, nome: true, marca: true, sabor: true, sku: true },
        },
      },
      orderBy: { product: { nome: "asc" } },
    }),
    getSellerFinancialTotals(sellerId),
  ]);

  const unidades = stocks.reduce((a, s) => a + s.quantidade, 0);

  return { seller, stocks, fin, unidades };
}

export async function listProdutosEmPosse(sellerId: string) {
  return prisma.sellerProductStock.findMany({
    where: { sellerId, quantidade: { gt: 0 } },
    include: {
      product: {
        select: {
          id: true,
          nome: true,
          marca: true,
          sabor: true,
          sku: true,
          precoVendaSugerido: true,
        },
      },
    },
    orderBy: { product: { nome: "asc" } },
  });
}

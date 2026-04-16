import { prisma } from "@/lib/db";
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";

export async function getVendedorPortalResumo(sellerId: string) {
  const [seller, stocks, fin] = await Promise.all([
    prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        nome: true,
        cidade: true,
        ativo: true,
        codigoVenda: true,
        consumoProprioHabilitado: true,
      },
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
          custoUnitario: true,
          precoVendaSugerido: true,
        },
      },
    },
    orderBy: { product: { nome: "asc" } },
  });
}

export async function listMapaReposicaoRede(sellerId: string) {
  const rows = await prisma.product.findMany({
    where: {
      ativo: true,
      OR: [
        { estoqueCentral: { gt: 0 } },
        { sellerStocks: { some: { quantidade: { gt: 0 } } } },
      ],
    },
    select: {
      id: true,
      nome: true,
      marca: true,
      sabor: true,
      sku: true,
      estoqueCentral: true,
      sellerStocks: {
        where: { quantidade: { gt: 0 } },
        select: {
          quantidade: true,
          sellerId: true,
          seller: { select: { nome: true, ativo: true } },
        },
      },
    },
    orderBy: { nome: "asc" },
    take: 300,
  });

  return rows
    .map((p) => {
      const meu = p.sellerStocks.find((s) => s.sellerId === sellerId)?.quantidade ?? 0;
      const outros = p.sellerStocks
        .filter((s) => s.sellerId !== sellerId && s.seller.ativo)
        .map((s) => ({ sellerId: s.sellerId, sellerNome: s.seller.nome, quantidade: s.quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);
      const totalOutros = outros.reduce((acc, o) => acc + o.quantidade, 0);
      return {
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        sabor: p.sabor,
        sku: p.sku,
        estoqueCentral: p.estoqueCentral,
        meuEstoque: meu,
        outros,
        totalOutros,
        totalRede: p.estoqueCentral + meu + totalOutros,
      };
    })
    .filter((p) => p.estoqueCentral > 0 || p.totalOutros > 0);
}

import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils/money";

export async function vendasPorVendedorNoPeriodo(from: Date, to: Date) {
  const rows = await prisma.venda.groupBy({
    by: ["vendedorId"],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { valorTotal: true, quantidade: true },
  });
  const sellers = await prisma.seller.findMany({
    where: { id: { in: rows.map((r) => r.vendedorId) } },
    select: { id: true, nome: true },
  });
  const nome = Object.fromEntries(sellers.map((s) => [s.id, s.nome]));
  return rows.map((r) => ({
    vendedorId: r.vendedorId,
    nome: nome[r.vendedorId] ?? r.vendedorId,
    valor: toNumber(r._sum.valorTotal),
    quantidade: r._sum.quantidade ?? 0,
  }));
}

export async function vendasPorProdutoNoPeriodo(from: Date, to: Date) {
  const rows = await prisma.venda.groupBy({
    by: ["produtoId"],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { valorTotal: true, quantidade: true },
  });
  const products = await prisma.product.findMany({
    where: { id: { in: rows.map((r) => r.produtoId) } },
    select: { id: true, nome: true, sku: true },
  });
  const meta = Object.fromEntries(
    products.map((p) => [p.id, `${p.nome} (${p.sku})`])
  );
  return rows.map((r) => ({
    produtoId: r.produtoId,
    nome: meta[r.produtoId] ?? r.produtoId,
    valor: toNumber(r._sum.valorTotal),
    quantidade: r._sum.quantidade ?? 0,
  }));
}

export async function recebimentosPorDiaNoPeriodo(from: Date, to: Date) {
  const rows = await prisma.recebimento.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { createdAt: true, valorRecebido: true },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + toNumber(r.valorRecebido));
  }
  return Array.from(map.entries()).map(([dia, valor]) => ({ dia, valor }));
}

export async function estoquePorVendedor() {
  const rows = await prisma.sellerProductStock.groupBy({
    by: ["sellerId"],
    _sum: { quantidade: true },
  });
  const sellers = await prisma.seller.findMany({
    where: { id: { in: rows.map((r) => r.sellerId) } },
    select: { id: true, nome: true },
  });
  const nome = Object.fromEntries(sellers.map((s) => [s.id, s.nome]));
  return rows.map((r) => ({
    vendedorId: r.sellerId,
    nome: nome[r.sellerId] ?? r.sellerId,
    quantidade: r._sum.quantidade ?? 0,
  }));
}

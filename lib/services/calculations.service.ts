import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils/money";

/** Somas de repasse/comissão via SQL — evita erro se o Prisma Client estiver desatualizado em relação ao schema. */
async function sumRepasseVendaPorVendedor(vendedorId: string): Promise<{
  totalComissaoRetida: number;
  totalSaldoRepasse: number;
}> {
  const rows = await prisma.$queryRaw<
    { comiss: unknown; saldo: unknown }[]
  >`
    SELECT
      COALESCE(SUM("valorComissaoRetida"), 0) AS comiss,
      COALESCE(SUM("valorSaldoRepasse"), 0) AS saldo
    FROM "Venda"
    WHERE "vendedorId" = ${vendedorId}
  `;
  const r = rows[0];
  return {
    totalComissaoRetida: toNumber(r?.comiss as never),
    totalSaldoRepasse: toNumber(r?.saldo as never),
  };
}

async function sumSaldoRepasseGlobal(): Promise<number> {
  const rows = await prisma.$queryRaw<{ saldo: unknown }[]>`
    SELECT COALESCE(SUM("valorSaldoRepasse"), 0) AS saldo
    FROM "Venda"
  `;
  return toNumber(rows[0]?.saldo as never);
}

/** Soma do estoque central (produtos ativos) */
export async function sumEstoqueCentral(): Promise<number> {
  const r = await prisma.product.aggregate({
    where: { ativo: true },
    _sum: { estoqueCentral: true },
  });
  return r._sum.estoqueCentral ?? 0;
}

/** Unidades em posse de todos os vendedores */
export async function sumEstoqueEmPosse(): Promise<number> {
  const r = await prisma.sellerProductStock.aggregate({
    _sum: { quantidade: true },
  });
  return r._sum.quantidade ?? 0;
}

export async function getSellerFinancialTotals(sellerId: string): Promise<{
  /** Valor pago pelos clientes (bruto). */
  totalVendas: number;
  /** Comissão já retida pelo vendedor (acumulado). */
  totalComissaoRetida: number;
  /** Valor líquido a repassar à empresa (base do saldo). */
  totalSaldoRepasse: number;
  totalRecebido: number;
  saldoPendente: number;
}> {
  const [brutoAgg, repasse, recebAgg] = await Promise.all([
    prisma.venda.aggregate({
      where: { vendedorId: sellerId },
      _sum: { valorTotal: true },
    }),
    sumRepasseVendaPorVendedor(sellerId),
    prisma.recebimento.aggregate({
      where: { vendedorId: sellerId },
      _sum: { valorRecebido: true },
    }),
  ]);
  const totalVendas = toNumber(brutoAgg._sum.valorTotal);
  const totalComissaoRetida = repasse.totalComissaoRetida;
  const totalSaldoRepasse = repasse.totalSaldoRepasse;
  const totalRecebido = toNumber(recebAgg._sum.valorRecebido);
  return {
    totalVendas,
    totalComissaoRetida,
    totalSaldoRepasse,
    totalRecebido,
    saldoPendente: Math.max(0, totalSaldoRepasse - totalRecebido),
  };
}

export async function getGlobalFinancialTotals(): Promise<{
  totalVendas: number;
  totalSaldoRepasse: number;
  totalRecebido: number;
  aReceber: number;
}> {
  const [brutoAgg, totalSaldoRepasse, recebAgg] = await Promise.all([
    prisma.venda.aggregate({ _sum: { valorTotal: true } }),
    sumSaldoRepasseGlobal(),
    prisma.recebimento.aggregate({ _sum: { valorRecebido: true } }),
  ]);
  const totalVendas = toNumber(brutoAgg._sum.valorTotal);
  const totalRecebido = toNumber(recebAgg._sum.valorRecebido);
  return {
    totalVendas,
    totalSaldoRepasse,
    totalRecebido,
    aReceber: Math.max(0, totalSaldoRepasse - totalRecebido),
  };
}

/** Vendas no período (por data da venda) */
export async function sumVendasNoPeriodo(from: Date, to: Date): Promise<number> {
  const r = await prisma.venda.aggregate({
    where: { createdAt: { gte: from, lte: to } },
    _sum: { valorTotal: true },
  });
  return toNumber(r._sum.valorTotal);
}

export async function sumRecebimentosNoPeriodo(
  from: Date,
  to: Date
): Promise<number> {
  const r = await prisma.recebimento.aggregate({
    where: { createdAt: { gte: from, lte: to } },
    _sum: { valorRecebido: true },
  });
  return toNumber(r._sum.valorRecebido);
}

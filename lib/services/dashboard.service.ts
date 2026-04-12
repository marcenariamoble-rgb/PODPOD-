import { prisma } from "@/lib/db";
import type { DashboardKpis } from "@/lib/types/domain";
import {
  getGlobalFinancialTotals,
  sumEstoqueCentral,
  sumEstoqueEmPosse,
  sumVendasNoPeriodo,
} from "@/lib/services/calculations.service";
import { logDevError } from "@/lib/utils/dev-log";

async function productStatsSeguro(): Promise<{
  totalProdutosCadastrados: number;
  produtosEstoqueBaixo: number;
}> {
  try {
    const [totalProdutosCadastrados, produtosParaAlerta] = await Promise.all([
      prisma.product.count({ where: { ativo: true } }),
      prisma.product.findMany({
        where: { ativo: true },
        select: { estoqueCentral: true, estoqueMinimo: true },
      }),
    ]);
    const produtosEstoqueBaixo = produtosParaAlerta.filter(
      (p) => p.estoqueCentral <= p.estoqueMinimo
    ).length;
    return { totalProdutosCadastrados, produtosEstoqueBaixo };
  } catch (e) {
    logDevError("productStatsSeguro", e);
    return { totalProdutosCadastrados: 0, produtosEstoqueBaixo: 0 };
  }
}

export async function getDashboardKpis(
  from: Date,
  to: Date
): Promise<DashboardKpis> {
  const [
    estoqueCentralTotal,
    { totalProdutosCadastrados, produtosEstoqueBaixo },
    estoqueEmPosseVendedores,
    totalVendidoPeriodo,
    financeiro,
    vendedoresAtivos,
  ] = await Promise.all([
    sumEstoqueCentral(),
    productStatsSeguro(),
    sumEstoqueEmPosse(),
    sumVendasNoPeriodo(from, to),
    getGlobalFinancialTotals(),
    prisma.seller.count({ where: { ativo: true } }),
  ]);

  return {
    estoqueCentralTotal,
    totalProdutosCadastrados,
    estoqueEmPosseVendedores,
    totalVendidoPeriodo,
    valorTotalAReceber: financeiro.aReceber,
    totalJaRecebido: financeiro.totalRecebido,
    vendedoresAtivos,
    produtosEstoqueBaixo,
  };
}

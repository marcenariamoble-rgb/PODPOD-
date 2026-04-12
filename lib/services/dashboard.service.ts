import { prisma } from "@/lib/db";
import type { DashboardKpis } from "@/lib/types/domain";
import {
  getGlobalFinancialTotals,
  sumEstoqueCentral,
  sumEstoqueEmPosse,
  sumVendasNoPeriodo,
} from "@/lib/services/calculations.service";

export async function getDashboardKpis(
  from: Date,
  to: Date
): Promise<DashboardKpis> {
  const [
    estoqueCentralTotal,
    totalProdutosCadastrados,
    estoqueEmPosseVendedores,
    totalVendidoPeriodo,
    financeiro,
    vendedoresAtivos,
    produtosParaAlerta,
  ] = await Promise.all([
    sumEstoqueCentral(),
    prisma.product.count({ where: { ativo: true } }),
    sumEstoqueEmPosse(),
    sumVendasNoPeriodo(from, to),
    getGlobalFinancialTotals(),
    prisma.seller.count({ where: { ativo: true } }),
    prisma.product.findMany({
      where: { ativo: true },
      select: { estoqueCentral: true, estoqueMinimo: true },
    }),
  ]);

  const produtosEstoqueBaixo = produtosParaAlerta.filter(
    (p) => p.estoqueCentral <= p.estoqueMinimo
  ).length;

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

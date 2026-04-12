import { StatusFinanceiro } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/utils/money";

/**
 * Quanto do pool de recebimentos foi atribuído a esta venda pelo mesmo FIFO
 * usado em {@link recalcularStatusVendasVendedor} (ordem por data da venda).
 * Usado no estorno para compensar o total recebido e o painel financeiro não
 * “manter” cobertura sobre uma venda que deixa de existir.
 */
export async function calcularMontanteRepasseCobertoFifoForVenda(
  vendedorId: string,
  vendaId: string
): Promise<number> {
  const [vendas, recebSum] = await Promise.all([
    prisma.venda.findMany({
      where: { vendedorId },
      orderBy: { createdAt: "asc" },
      select: { id: true, valorSaldoRepasse: true },
    }),
    prisma.recebimento.aggregate({
      where: { vendedorId },
      _sum: { valorRecebido: true },
    }),
  ]);

  let pool = toNumber(recebSum._sum.valorRecebido);

  for (const v of vendas) {
    const need = toNumber(v.valorSaldoRepasse);
    if (v.id === vendaId) {
      return Math.min(need, Math.max(0, pool));
    }
    const paid = Math.min(need, pool);
    pool = Math.max(0, pool - paid);
  }
  return 0;
}

/**
 * Realoca status das vendas do vendedor por FIFO sobre o total já recebido.
 */
export async function recalcularStatusVendasVendedor(
  vendedorId: string
): Promise<void> {
  const [vendas, recebSum] = await Promise.all([
    prisma.$queryRaw<
      { id: string; valorSaldoRepasse: unknown; statusFinanceiro: string }[]
    >`
      SELECT "id", "valorSaldoRepasse", "statusFinanceiro"::text AS "statusFinanceiro"
      FROM "Venda"
      WHERE "vendedorId" = ${vendedorId}
      ORDER BY "createdAt" ASC
    `,
    prisma.recebimento.aggregate({
      where: { vendedorId },
      _sum: { valorRecebido: true },
    }),
  ]);

  let pool = toNumber(recebSum._sum.valorRecebido);

  for (const v of vendas) {
    const valor = toNumber(v.valorSaldoRepasse as never);
    let status: StatusFinanceiro;
    if (pool >= valor) {
      status = StatusFinanceiro.PAGO;
      pool -= valor;
    } else if (pool > 0) {
      status = StatusFinanceiro.PARCIAL;
      pool = 0;
    } else {
      status = StatusFinanceiro.PENDENTE;
    }
    if (v.statusFinanceiro !== status) {
      await prisma.venda.update({
        where: { id: v.id },
        data: { statusFinanceiro: status as StatusFinanceiro },
      });
    }
  }
}

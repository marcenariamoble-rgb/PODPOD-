import { StatusFinanceiro } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logDevError } from "@/lib/utils/dev-log";
import { toNumber } from "@/lib/utils/money";

function fifoMontanteAplicado(
  vendas: { id: string; need: number }[],
  poolInicial: number,
  vendaId: string
): number {
  let pool = poolInicial;
  for (const v of vendas) {
    const need = v.need;
    if (v.id === vendaId) {
      return Math.min(need, Math.max(0, pool));
    }
    const paid = Math.min(need, pool);
    pool = Math.max(0, pool - paid);
  }
  return 0;
}

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
  const recebSum = await prisma.recebimento.aggregate({
    where: { vendedorId },
    _sum: { valorRecebido: true },
  });
  const poolInicial = toNumber(recebSum._sum.valorRecebido);

  let vendas: { id: string; need: number }[];
  try {
    const rows = await prisma.venda.findMany({
      where: { vendedorId },
      orderBy: { createdAt: "asc" },
      select: { id: true, valorSaldoRepasse: true },
    });
    vendas = rows.map((r) => ({
      id: r.id,
      need: toNumber(r.valorSaldoRepasse),
    }));
  } catch (e) {
    logDevError("calcularMontanteRepasseCobertoFifoForVenda(fallback)", e);
    const rows = await prisma.venda.findMany({
      where: { vendedorId },
      orderBy: { createdAt: "asc" },
      select: { id: true, valorTotal: true, valorComissaoRetida: true },
    });
    vendas = rows.map((r) => ({
      id: r.id,
      need: Math.max(
        0,
        toNumber(r.valorTotal) - toNumber(r.valorComissaoRetida)
      ),
    }));
  }

  return fifoMontanteAplicado(vendas, poolInicial, vendaId);
}

/**
 * Realoca status das vendas do vendedor por FIFO sobre o total já recebido.
 */
export async function recalcularStatusVendasVendedor(
  vendedorId: string
): Promise<void> {
  const [vendas, recebSum] = await Promise.all([
    prisma.venda.findMany({
      where: { vendedorId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        valorSaldoRepasse: true,
        statusFinanceiro: true,
      },
    }),
    prisma.recebimento.aggregate({
      where: { vendedorId },
      _sum: { valorRecebido: true },
    }),
  ]);

  let pool = toNumber(recebSum._sum.valorRecebido);

  for (const v of vendas) {
    const valor = toNumber(v.valorSaldoRepasse);
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
        data: { statusFinanceiro: status },
      });
    }
  }
}

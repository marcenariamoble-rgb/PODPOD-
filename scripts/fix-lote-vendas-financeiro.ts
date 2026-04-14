import { prisma } from "@/lib/db";
import { calcularRepasseVenda } from "@/lib/services/comissao-vendedor.service";
import { recalcularStatusVendasVendedor } from "@/lib/services/financeiro.service";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main() {
  const vendas = await prisma.venda.findMany({
    where: {
      OR: [
        { observacoes: { startsWith: "[Lote " } },
        { valorUnitario: { lte: 0 } },
        { valorTotal: { lte: 0 } },
      ],
    },
    select: {
      id: true,
      vendedorId: true,
      produtoId: true,
      quantidade: true,
      valorUnitario: true,
      valorTotal: true,
      observacoes: true,
      vendedor: {
        select: {
          comissaoDescontaNaVenda: true,
          comissaoTipo: true,
          comissaoPercentual: true,
          comissaoPorUnidade: true,
        },
      },
      produto: {
        select: {
          precoVendaSugerido: true,
        },
      },
      movimentacaoDaVenda: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (vendas.length === 0) {
    console.log("Nenhuma venda candidata encontrada para corrigir.");
    return;
  }

  let changed = 0;
  let fallbackPrecoSugerido = 0;
  const sellers = new Set<string>();

  for (const v of vendas) {
    const qtd = Math.max(0, Math.floor(Number(v.quantidade)));
    if (qtd <= 0) continue;

    let vu = Number(v.valorUnitario);
    if (!Number.isFinite(vu) || vu <= 0) {
      vu = Number(v.produto.precoVendaSugerido);
      fallbackPrecoSugerido += 1;
    }
    if (!Number.isFinite(vu) || vu < 0) continue;

    const valorTotal = round2(vu * qtd);
    const repasse = calcularRepasseVenda(valorTotal, qtd, v.vendedor);
    const valorComissaoRetida = round2(repasse.valorComissaoRetida);
    const valorSaldoRepasse = round2(repasse.valorSaldoRepasse);

    const same =
      round2(Number(v.valorUnitario)) === vu &&
      round2(Number(v.valorTotal)) === valorTotal;

    if (!same) {
      await prisma.venda.update({
        where: { id: v.id },
        data: {
          valorUnitario: vu,
          valorTotal,
          valorComissaoRetida,
          valorSaldoRepasse,
        },
      });

      if (v.movimentacaoDaVenda?.id) {
        await prisma.movimentacaoEstoque.update({
          where: { id: v.movimentacaoDaVenda.id },
          data: {
            valorUnitario: vu,
            valorTotal,
          },
        });
      }
      changed += 1;
    } else {
      // Mesmo sem mudança de bruto, força consistência de repasse/comissão.
      await prisma.venda.update({
        where: { id: v.id },
        data: {
          valorComissaoRetida,
          valorSaldoRepasse,
        },
      });
    }

    sellers.add(v.vendedorId);
  }

  for (const sellerId of sellers) {
    await recalcularStatusVendasVendedor(sellerId);
  }

  console.log(
    [
      `Vendas em lote analisadas: ${vendas.length}`,
      `Vendas com valor corrigido: ${changed}`,
      `Vendas que usaram preço sugerido por valor zero/inválido: ${fallbackPrecoSugerido}`,
      `Vendedores recalculados: ${sellers.size}`,
    ].join("\n")
  );
}

main()
  .catch((e) => {
    console.error("Falha na correção de vendas em lote:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


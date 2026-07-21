/**
 * Corrige custo STRAWBERRY ICE V80: 57,50 → 60,00 (cadastro + histórico).
 * Uso: node scripts/fix-custo-strawberry-ice-v80.mjs [--dry-run]
 */
import "dotenv/config";
import { PrismaClient, StatusFinanceiro } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dryRun = process.argv.includes("--dry-run");
const CUSTO_ANTIGO = 57.5;
const CUSTO_NOVO = 60;
const SKU = "STRAWBERRY-ICE-MNW8B8C5";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const n = (v) => (v == null ? 0 : Number(v));
const round2 = (x) => Math.round(x * 100) / 100;

async function recalcularStatusVendasVendedor(vendedorId) {
  const [vendas, recebSum] = await Promise.all([
    prisma.venda.findMany({
      where: { vendedorId },
      orderBy: { createdAt: "asc" },
      select: { id: true, valorSaldoRepasse: true, statusFinanceiro: true },
    }),
    prisma.recebimento.aggregate({
      where: { vendedorId },
      _sum: { valorRecebido: true },
    }),
  ]);

  let poolFifo = n(recebSum._sum.valorRecebido);

  for (const v of vendas) {
    const valor = n(v.valorSaldoRepasse);
    let status;
    if (poolFifo >= valor) {
      status = StatusFinanceiro.PAGO;
      poolFifo -= valor;
    } else if (poolFifo > 0) {
      status = StatusFinanceiro.PARCIAL;
      poolFifo = 0;
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

async function main() {
  const product = await prisma.product.findFirst({
    where: { sku: SKU },
  });
  if (!product) {
    console.error("Produto não encontrado:", SKU);
    process.exit(1);
  }

  const custoAtual = n(product.custoUnitario);
  console.log(
    `Produto: ${product.nome} (${product.marca}) | SKU ${SKU} | custo atual: ${custoAtual}`
  );

  // Vendas lançadas com o custo antigo (consumo próprio ou unitário = 57,50)
  const vendas = await prisma.venda.findMany({
    where: {
      produtoId: product.id,
      valorUnitario: { gte: CUSTO_ANTIGO - 0.02, lte: CUSTO_ANTIGO + 0.02 },
    },
    select: {
      id: true,
      vendedorId: true,
      quantidade: true,
      valorUnitario: true,
      valorTotal: true,
      valorSaldoRepasse: true,
      valorComissaoRetida: true,
      formaPagamento: true,
      createdAt: true,
    },
  });

  const outrosProdutos57 = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      custoUnitario: { gte: CUSTO_ANTIGO - 0.02, lte: CUSTO_ANTIGO + 0.02 },
    },
    select: { id: true, nome: true, marca: true, sku: true, custoUnitario: true },
  });

  console.log("Vendas no histórico com unitário 57,50:", vendas.length);
  for (const v of vendas) {
    console.log(
      `  - ${v.id} | ${v.createdAt.toISOString().slice(0, 10)} | qtd ${v.quantidade} | total ${n(v.valorTotal)} | ${v.formaPagamento ?? "venda"}`
    );
  }

  if (outrosProdutos57.length) {
    console.log("Atenção: outros produtos com custo 57,50 no cadastro:", outrosProdutos57);
  }

  if (Math.abs(custoAtual - CUSTO_NOVO) < 0.01 && vendas.length === 0) {
    console.log("Nada a corrigir — já está em 60,00.");
    return;
  }

  if (dryRun) {
    console.log("[dry-run] Atualizaria cadastro → 60,00 e", vendas.length, "venda(s).");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (Math.abs(custoAtual - CUSTO_NOVO) >= 0.01) {
      await tx.product.update({
        where: { id: product.id },
        data: { custoUnitario: CUSTO_NOVO },
      });
    }

    for (const v of vendas) {
      const qtd = v.quantidade;
      const valorUnitario = CUSTO_NOVO;
      const valorTotal = round2(valorUnitario * qtd);
      const valorComissaoRetida = n(v.valorComissaoRetida);
      const valorSaldoRepasse =
        v.formaPagamento === "CONSUMO_PROPRIO"
          ? valorTotal
          : round2(valorTotal - valorComissaoRetida);

      await tx.venda.update({
        where: { id: v.id },
        data: { valorUnitario, valorTotal, valorSaldoRepasse },
      });

      await tx.movimentacaoEstoque.updateMany({
        where: { vendaId: v.id },
        data: { valorUnitario, valorTotal },
      });
    }
  });

  const vendedoresAfetados = [...new Set(vendas.map((v) => v.vendedorId))];
  for (const vid of vendedoresAfetados) {
    await recalcularStatusVendasVendedor(vid);
  }

  console.log("Concluído: custo cadastro → R$ 60,00 | vendas corrigidas:", vendas.length);
  if (vendedoresAfetados.length) {
    console.log("FIFO recalculado para vendedor(es):", vendedoresAfetados.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

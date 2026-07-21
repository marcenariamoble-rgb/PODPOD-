/**
 * Auditoria financeira de um vendedor (acerto / saldo pendente).
 * Uso: node scripts/audit-vendedor-acerto.mjs "JOÃO M"
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { endOfMonth, startOfMonth } from "date-fns";

const searchName = process.argv[2] ?? "JOÃO M";
const TARGET = 1346.25;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const round2 = (n) => Math.round(n * 100) / 100;
const n = (v) => (v == null ? 0 : Number(v));
const near = (x) => Math.abs(x - TARGET) < 0.02;

async function main() {
  const seller = await prisma.seller.findFirst({
    where: { nome: { contains: searchName, mode: "insensitive" } },
  });
  if (!seller) {
    console.log("Vendedor não encontrado");
    return;
  }
  const id = seller.id;
  const pctSocio = n(seller.acertoSocietarioPercentual ?? 50);

  const [vendas, recebimentos] = await Promise.all([
    prisma.venda.findMany({
      where: { vendedorId: id },
      orderBy: { createdAt: "asc" },
      include: { produto: { select: { nome: true, custoUnitario: true } } },
    }),
    prisma.recebimento.findMany({
      where: { vendedorId: id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRepasse = round2(vendas.reduce((a, v) => a + n(v.valorSaldoRepasse), 0));
  const totalRecebido = round2(recebimentos.reduce((a, r) => a + n(r.valorRecebido), 0));
  const saldoPendente = round2(Math.max(0, totalRepasse - totalRecebido));

  // Acerto societário (lógica da ficha do vendedor)
  const brutoAll = round2(vendas.reduce((a, v) => a + n(v.valorTotal), 0));
  const custoAll = round2(
    vendas.reduce((a, v) => a + n(v.produto.custoUnitario) * v.quantidade, 0)
  );
  const lucroAll = round2(Math.max(0, brutoAll - custoAll));
  const parcelaSocioAll = round2((lucroAll * pctSocio) / 100);

  const matches = [];

  const check = (label, value) => {
    if (near(value)) matches.push({ label, value });
  };

  check("saldoPendente (repasse - recebido)", saldoPendente);
  check("parcelaSocio 50% lucro (histórico total)", parcelaSocioAll);
  check("lucro histórico total", lucroAll);
  check("bruto - recebido", round2(brutoAll - totalRecebido));
  check("repasse/2", round2(totalRepasse / 2));
  check("bruto/2", round2(brutoAll / 2));

  // Por mês
  const meses = new Map();
  for (const v of vendas) {
    const k = v.createdAt.toISOString().slice(0, 7);
    if (!meses.has(k)) meses.set(k, { vendas: [], receb: [] });
    meses.get(k).vendas.push(v);
  }
  for (const r of recebimentos) {
    const k = r.createdAt.toISOString().slice(0, 7);
    if (!meses.has(k)) meses.set(k, { vendas: [], receb: [] });
    meses.get(k).receb.push(r);
  }

  const porMes = [];
  for (const [mes, { vendas: vv, receb: rr }] of [...meses.entries()].sort()) {
    const bruto = round2(vv.reduce((a, v) => a + n(v.valorTotal), 0));
    const repasse = round2(vv.reduce((a, v) => a + n(v.valorSaldoRepasse), 0));
    const custo = round2(vv.reduce((a, v) => a + n(v.produto.custoUnitario) * v.quantidade, 0));
    const lucro = round2(Math.max(0, bruto - custo));
    const parcelaSocio = round2((lucro * pctSocio) / 100);
    const recebido = round2(rr.reduce((a, r) => a + n(r.valorRecebido), 0));
    const pendente = round2(Math.max(0, repasse - recebido));
    const row = { mes, bruto, custo, lucro, parcelaSocio, repasse, recebido, pendente, qtdVendas: vv.length, qtdReceb: rr.length };
    porMes.push(row);
    check(`pendente mês ${mes}`, pendente);
    check(`parcelaSocio mês ${mes}`, parcelaSocio);
    check(`lucro mês ${mes}`, lucro);
  }

  // Duplicatas recebimento (mesmo valor+data próxima)
  const dupReceb = [];
  for (let i = 0; i < recebimentos.length; i++) {
    for (let j = i + 1; j < recebimentos.length; j++) {
      const a = recebimentos[i];
      const b = recebimentos[j];
      if (
        n(a.valorRecebido) === n(b.valorRecebido) &&
        Math.abs(a.createdAt - b.createdAt) < 5 * 60 * 1000
      ) {
        dupReceb.push({
          valor: n(a.valorRecebido),
          dataA: a.createdAt,
          dataB: b.createdAt,
          obsA: a.observacoes,
          obsB: b.observacoes,
        });
      }
    }
  }

  // FIFO detalhado — soma pendente por vendas PENDENTE+PARCIAL
  let poolFifo = totalRecebido;
  const pendentesDetalhe = [];
  for (const v of vendas) {
    const need = n(v.valorSaldoRepasse);
    let coberto = 0;
    let status;
    if (poolFifo >= need) {
      status = "PAGO";
      poolFifo -= need;
      coberto = need;
    } else if (poolFifo > 0) {
      status = "PARCIAL";
      coberto = poolFifo;
      poolFifo = 0;
    } else {
      status = "PENDENTE";
      coberto = 0;
    }
    const falta = round2(need - coberto);
    if (falta > 0.01) {
      pendentesDetalhe.push({
        data: v.createdAt.toISOString().slice(0, 10),
        produto: v.produto.nome,
        forma: v.formaPagamento,
        repasse: need,
        falta,
        status,
      });
    }
  }
  const somaFaltaFifo = round2(pendentesDetalhe.reduce((a, p) => a + p.falta, 0));

  // Mês atual (Jun 2026 per user date - but data might be 2026)
  const now = new Date();
  const fromMes = startOfMonth(now);
  const toMes = endOfMonth(now);
  const vendasMes = vendas.filter((v) => v.createdAt >= fromMes && v.createdAt <= toMes);
  const recebMes = recebimentos.filter((r) => r.createdAt >= fromMes && r.createdAt <= toMes);
  const repasseMes = round2(vendasMes.reduce((a, v) => a + n(v.valorSaldoRepasse), 0));
  const recebidoMes = round2(recebMes.reduce((a, r) => a + n(r.valorRecebido), 0));
  const pendenteMes = round2(Math.max(0, repasseMes - recebidoMes));

  // Vendas após último recebimento
  const ultimoReceb = recebimentos[recebimentos.length - 1];
  const vendasAposUltimoReceb = ultimoReceb
    ? vendas.filter((v) => v.createdAt > ultimoReceb.createdAt)
    : vendas;
  const repasseApos = round2(vendasAposUltimoReceb.reduce((a, v) => a + n(v.valorSaldoRepasse), 0));

  console.log(
    JSON.stringify(
      {
        vendedor: { id: seller.id, nome: seller.nome, acertoSocietario: seller.acertoSocietarioAtivo, pctSocio },
        valorProcurado: TARGET,
        totaisAtuais: {
          bruto: brutoAll,
          repasse: totalRepasse,
          recebido: totalRecebido,
          saldoPendente,
          lucroHistorico: lucroAll,
          parcelaSocio50: parcelaSocioAll,
        },
        formulasQueBatemCom1346_25: matches,
        mesAtual: {
          label: `${fromMes.toISOString().slice(0, 7)}`,
          repasse: repasseMes,
          recebido: recebidoMes,
          pendente: pendenteMes,
        },
        repasseAposUltimoRecebimento: repasseApos,
        ultimoRecebimento: ultimoReceb
          ? { data: ultimoReceb.createdAt, valor: n(ultimoReceb.valorRecebido) }
          : null,
        porMes,
        fifo: { somaFaltaPorVenda: somaFaltaFifo, saldoPendente, diff: round2(saldoPendente - somaFaltaFifo) },
        pendentesDetalhe,
        recebimentosDuplicadosSuspeitos: dupReceb,
        nota:
          matches.length === 0
            ? "1346.25 não bate com totais atuais na base — pode ser período antigo, ecrã de acerto societário, ou dados já alterados."
            : undefined,
      },
      null,
      2
    )
  );
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

import { prisma } from "@/lib/db";
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";
import { toNumber } from "@/lib/utils/money";

export type FinanceiroVendedorRow = {
  id: string;
  nome: string;
  regiao: string | null;
  cidade: string | null;
  ativo: boolean;
  totalVendas: number;
  totalComissaoRetida: number;
  totalSaldoRepasse: number;
  totalRecebido: number;
  saldoPendente: number;
};

export type FinanceiroCategoriaRow = {
  categoria: string;
  valorTotal: number;
  quantidade: number;
};

export type FinanceiroRegiaoRow = {
  regiao: string;
  vendedores: number;
  totalVendas: number;
  totalSaldoRepasse: number;
  totalRecebido: number;
  saldoPendente: number;
};

export async function listFinanceiroPorVendedor(): Promise<FinanceiroVendedorRow[]> {
  const sellers = await prisma.seller.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, regiao: true, cidade: true, ativo: true },
  });
  const rows = await Promise.all(
    sellers.map(async (s) => {
      const fin = await getSellerFinancialTotals(s.id);
      return {
        id: s.id,
        nome: s.nome,
        regiao: s.regiao,
        cidade: s.cidade,
        ativo: s.ativo,
        ...fin,
      };
    })
  );
  return rows;
}

export function aggregateFinanceiroPorRegiao(
  rows: FinanceiroVendedorRow[]
): FinanceiroRegiaoRow[] {
  const map = new Map<
    string,
    {
      vendedores: number;
      totalVendas: number;
      totalSaldoRepasse: number;
      totalRecebido: number;
      saldoPendente: number;
    }
  >();
  for (const r of rows) {
    const key = (r.regiao ?? "").trim() || "Sem região";
    const cur = map.get(key) ?? {
      vendedores: 0,
      totalVendas: 0,
      totalSaldoRepasse: 0,
      totalRecebido: 0,
      saldoPendente: 0,
    };
    cur.vendedores += 1;
    cur.totalVendas += r.totalVendas;
    cur.totalSaldoRepasse += r.totalSaldoRepasse;
    cur.totalRecebido += r.totalRecebido;
    cur.saldoPendente += r.saldoPendente;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([regiao, v]) => ({ regiao, ...v }))
    .sort((a, b) => b.totalSaldoRepasse - a.totalSaldoRepasse);
}

export async function listVendasAgregadasPorCategoria(): Promise<
  FinanceiroCategoriaRow[]
> {
  const rows = await prisma.$queryRaw<
    { categoria: string; valor: unknown; qtd: unknown }[]
  >`
    SELECT
      p.categoria,
      COALESCE(SUM(v."valorTotal"), 0) AS valor,
      COALESCE(SUM(v.quantidade), 0)::int AS qtd
    FROM "Venda" v
    INNER JOIN "Product" p ON p.id = v."produtoId"
    GROUP BY p.categoria
    ORDER BY COALESCE(SUM(v."valorTotal"), 0) DESC
  `;
  return rows.map((r) => ({
    categoria: r.categoria || "—",
    valorTotal: toNumber(r.valor as never),
    quantidade: Number(r.qtd ?? 0),
  }));
}

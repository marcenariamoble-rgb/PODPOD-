import { prisma } from "@/lib/db";
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";
import { endOfDay, startOfDay } from "date-fns";

export async function getVendedorPortalResumo(sellerId: string) {
  const [seller, stocks, fin] = await Promise.all([
    prisma.seller.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        nome: true,
        cidade: true,
        ativo: true,
        codigoVenda: true,
        consumoProprioHabilitado: true,
      },
    }),
    prisma.sellerProductStock.findMany({
      where: { sellerId, quantidade: { gt: 0 } },
      include: {
        product: {
          select: { id: true, nome: true, marca: true, sabor: true, sku: true },
        },
      },
      orderBy: { product: { nome: "asc" } },
    }),
    getSellerFinancialTotals(sellerId),
  ]);

  const unidades = stocks.reduce((a, s) => a + s.quantidade, 0);

  return { seller, stocks, fin, unidades };
}

export async function listProdutosEmPosse(sellerId: string) {
  return prisma.sellerProductStock.findMany({
    where: { sellerId, quantidade: { gt: 0 } },
    include: {
      product: {
        select: {
          id: true,
          nome: true,
          marca: true,
          sabor: true,
          sku: true,
          custoUnitario: true,
          precoVendaSugerido: true,
        },
      },
    },
    orderBy: { product: { nome: "asc" } },
  });
}

export async function listMapaReposicaoRede(sellerId: string) {
  const rows = await prisma.product.findMany({
    where: {
      ativo: true,
      OR: [
        { estoqueCentral: { gt: 0 } },
        { sellerStocks: { some: { quantidade: { gt: 0 } } } },
      ],
    },
    select: {
      id: true,
      nome: true,
      marca: true,
      sabor: true,
      sku: true,
      estoqueCentral: true,
      sellerStocks: {
        where: { quantidade: { gt: 0 } },
        select: {
          quantidade: true,
          sellerId: true,
          seller: { select: { nome: true, ativo: true } },
        },
      },
    },
    orderBy: { nome: "asc" },
    take: 300,
  });

  return rows
    .map((p) => {
      const meu = p.sellerStocks.find((s) => s.sellerId === sellerId)?.quantidade ?? 0;
      const outros = p.sellerStocks
        .filter((s) => s.sellerId !== sellerId && s.seller.ativo)
        .map((s) => ({ sellerId: s.sellerId, sellerNome: s.seller.nome, quantidade: s.quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);
      const totalOutros = outros.reduce((acc, o) => acc + o.quantidade, 0);
      return {
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        sabor: p.sabor,
        sku: p.sku,
        estoqueCentral: p.estoqueCentral,
        meuEstoque: meu,
        outros,
        totalOutros,
        totalRede: p.estoqueCentral + meu + totalOutros,
      };
    })
    .filter((p) => p.estoqueCentral > 0 || p.totalOutros > 0);
}

export type VendedorHistoricoTipoFiltro =
  | "TODOS"
  | "VENDA"
  | "RECEBIMENTO"
  | "ENTREGA_COMODATO"
  | "DEVOLUCAO"
  | "ESTORNO_VENDA"
  | "PERDA"
  | "AJUSTE";

export type VendedorHistoricoItem = {
  id: string;
  kind: VendedorHistoricoTipoFiltro;
  createdAt: Date;
  titulo: string;
  descricao: string;
  valor?: number;
  quantidade?: number;
  produtoNome?: string;
  formaPagamento?: string;
  observacoes?: string | null;
};

export async function listHistoricoVendedor(
  sellerId: string,
  filters?: {
    tipo?: VendedorHistoricoTipoFiltro;
    de?: string;
    ate?: string;
    take?: number;
  }
) {
  const tipo = filters?.tipo ?? "TODOS";
  const take = Math.min(500, Math.max(20, filters?.take ?? 200));
  const createdAtFilter: { gte?: Date; lte?: Date } = {};
  if (filters?.de) {
    const de = new Date(filters.de);
    if (!Number.isNaN(de.getTime())) createdAtFilter.gte = startOfDay(de);
  }
  if (filters?.ate) {
    const ate = new Date(filters.ate);
    if (!Number.isNaN(ate.getTime())) createdAtFilter.lte = endOfDay(ate);
  }
  const hasDateFilter = Boolean(createdAtFilter.gte || createdAtFilter.lte);

  const [vendas, recebimentos, movimentacoes] = await Promise.all([
    tipo === "TODOS" || tipo === "VENDA"
      ? prisma.venda.findMany({
          where: {
            vendedorId: sellerId,
            ...(hasDateFilter ? { createdAt: createdAtFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
          take,
          include: { produto: { select: { nome: true } } },
        })
      : Promise.resolve([]),
    tipo === "TODOS" || tipo === "RECEBIMENTO"
      ? prisma.recebimento.findMany({
          where: {
            vendedorId: sellerId,
            ...(hasDateFilter ? { createdAt: createdAtFilter } : {}),
          },
          orderBy: { createdAt: "desc" },
          take,
        })
      : Promise.resolve([]),
    tipo === "TODOS" ||
    tipo === "ENTREGA_COMODATO" ||
    tipo === "DEVOLUCAO" ||
    tipo === "ESTORNO_VENDA" ||
    tipo === "PERDA" ||
    tipo === "AJUSTE"
      ? prisma.movimentacaoEstoque.findMany({
          where: {
            vendedorId: sellerId,
            ...(hasDateFilter ? { createdAt: createdAtFilter } : {}),
            tipoMovimentacao: {
              in:
                tipo === "TODOS"
                  ? ["ENTREGA_COMODATO", "DEVOLUCAO", "ESTORNO_VENDA", "PERDA", "AJUSTE"]
                  : [tipo],
            },
          },
          orderBy: { createdAt: "desc" },
          take,
          include: { produto: { select: { nome: true } } },
        })
      : Promise.resolve([]),
  ]);

  const timeline: VendedorHistoricoItem[] = [
    ...vendas.map((v) => ({
      id: `VENDA:${v.id}`,
      kind: "VENDA" as const,
      createdAt: v.createdAt,
      titulo: "Venda registrada",
      descricao: `${v.produto.nome} · ${v.quantidade} unidade(s)`,
      valor: Number(v.valorTotal),
      quantidade: v.quantidade,
      produtoNome: v.produto.nome,
      formaPagamento: v.formaPagamento ?? undefined,
      observacoes: v.observacoes,
    })),
    ...recebimentos.map((r) => ({
      id: `RECEBIMENTO:${r.id}`,
      kind: "RECEBIMENTO" as const,
      createdAt: r.createdAt,
      titulo: "Pagamento recebido pela empresa",
      descricao: "Repasse do vendedor registrado",
      valor: Number(r.valorRecebido),
      formaPagamento: r.formaPagamento,
      observacoes: r.observacoes,
    })),
    ...movimentacoes.map((m) => ({
      id: `${m.tipoMovimentacao}:${m.id}`,
      kind: m.tipoMovimentacao as VendedorHistoricoTipoFiltro,
      createdAt: m.createdAt,
      titulo:
        m.tipoMovimentacao === "ENTREGA_COMODATO"
          ? "Comodato recebido"
          : m.tipoMovimentacao === "DEVOLUCAO"
            ? "Devolução registrada"
            : m.tipoMovimentacao === "ESTORNO_VENDA"
              ? "Estorno de venda"
              : m.tipoMovimentacao === "PERDA"
                ? "Perda / avaria"
                : "Ajuste de estoque",
      descricao: `${m.produto.nome} · ${m.quantidade} unidade(s)`,
      valor: m.valorTotal != null ? Number(m.valorTotal) : undefined,
      quantidade: m.quantidade,
      produtoNome: m.produto.nome,
      observacoes: m.observacoes,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, take);

  return timeline;
}

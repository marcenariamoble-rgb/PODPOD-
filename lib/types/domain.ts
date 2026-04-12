import type {
  MovimentacaoEstoque,
  Product,
  Recebimento,
  Seller,
  TipoMovimentacao,
  User,
  Venda,
} from "@prisma/client";

export type {
  Product,
  Seller,
  User,
  Venda,
  Recebimento,
  MovimentacaoEstoque,
  TipoMovimentacao,
};

export type ProductWithLowStock = Product & { estoqueBaixo: boolean };

export type SellerBalance = {
  sellerId: string;
  totalVendas: number;
  totalComissaoRetida: number;
  totalSaldoRepasse: number;
  totalRecebido: number;
  saldoPendente: number;
};

export type DashboardKpis = {
  estoqueCentralTotal: number;
  totalProdutosCadastrados: number;
  estoqueEmPosseVendedores: number;
  totalVendidoPeriodo: number;
  valorTotalAReceber: number;
  totalJaRecebido: number;
  vendedoresAtivos: number;
  produtosEstoqueBaixo: number;
};

export type PeriodFilter = {
  from: Date;
  to: Date;
};

import { prisma } from "@/lib/db";

export type SellerComAlertaOpcao = {
  id: string;
  nome: string;
  ativo: boolean;
  telefone: string | null;
  temUsuarioVendedor: boolean;
  emailUsuario: string | null;
  recebeAlertaCardapio: boolean;
};

export async function listSellersParaAlertaCardapio(): Promise<SellerComAlertaOpcao[]> {
  const [sellers, alertas] = await Promise.all([
    prisma.seller.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        ativo: true,
        telefone: true,
        user: { select: { email: true, role: true } },
      },
    }),
    prisma.cardapioAlertaVendedor.findMany({ select: { sellerId: true } }),
  ]);
  const setAlerta = new Set(alertas.map((a) => a.sellerId));
  return sellers.map((s) => ({
    id: s.id,
    nome: s.nome,
    ativo: s.ativo,
    telefone: s.telefone,
    temUsuarioVendedor: !!s.user && s.user.role === "VENDEDOR",
    emailUsuario: s.user?.role === "VENDEDOR" ? s.user.email : null,
    recebeAlertaCardapio: setAlerta.has(s.id),
  }));
}

export async function countNotificacoesCardapioNaoLidas(
  sellerId: string
): Promise<number> {
  return prisma.notificacaoSolicitacaoCardapio.count({
    where: { sellerId, lida: false },
  });
}

export type NotificacaoCardapioVendedorItem = {
  id: string;
  lida: boolean;
  createdAt: Date;
  solicitacaoId: string;
  quantidade: number;
  nomeContato: string | null;
  telefone: string | null;
  observacoes: string | null;
  produtoNome: string;
  produtoSku: string;
};

export async function listNotificacoesCardapioVendedor(
  sellerId: string
): Promise<NotificacaoCardapioVendedorItem[]> {
  const rows = await prisma.notificacaoSolicitacaoCardapio.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      solicitacao: {
        include: {
          produto: { select: { nome: true, sku: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    lida: r.lida,
    createdAt: r.createdAt,
    solicitacaoId: r.solicitacaoCardapioId,
    quantidade: r.solicitacao.quantidade,
    nomeContato: r.solicitacao.nomeContato,
    telefone: r.solicitacao.telefone,
    observacoes: r.solicitacao.observacoes,
    produtoNome: r.solicitacao.produto.nome,
    produtoSku: r.solicitacao.produto.sku,
  }));
}

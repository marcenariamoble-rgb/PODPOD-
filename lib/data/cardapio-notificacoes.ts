import { prisma } from "@/lib/db";

/** Delegates opcionais se o Prisma Client em memória estiver desatualizado. */
function delegates() {
  return prisma as unknown as {
    cardapioAlertaVendedor?: {
      findMany: (args: {
        select: { sellerId: true };
      }) => Promise<{ sellerId: string }[]>;
    };
    notificacaoSolicitacaoCardapio?: {
      count: (args: {
        where: { sellerId: string; lida: boolean };
      }) => Promise<number>;
      findMany: (args: {
        where: { sellerId: string };
        orderBy: { createdAt: "desc" };
        take: number;
        include: {
          solicitacao: {
            include: {
              produto: { select: { nome: true; sku: true } };
            };
          };
        };
      }) => Promise<
        {
          id: string;
          lida: boolean;
          createdAt: Date;
          solicitacaoCardapioId: string;
          solicitacao: {
            quantidade: number;
            nomeContato: string | null;
            telefone: string | null;
            observacoes: string | null;
            produto: { nome: string; sku: string };
          };
        }[]
      >;
    };
  };
}

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
  const d = delegates().cardapioAlertaVendedor;
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
    d ? d.findMany({ select: { sellerId: true } }) : Promise.resolve([]),
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
  const n = delegates().notificacaoSolicitacaoCardapio;
  if (!n) return 0;
  return n.count({
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
  const n = delegates().notificacaoSolicitacaoCardapio;
  if (!n) return [];

  const rows = await n.findMany({
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

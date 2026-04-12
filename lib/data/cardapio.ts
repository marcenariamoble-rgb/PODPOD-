import { prisma } from "@/lib/db";

/** Dados públicos do cardápio — sem quantidades de estoque. */
export type CardapioProduto = {
  id: string;
  nome: string;
  marca: string;
  sabor: string;
  categoria: string;
  sku: string;
  precoVendaSugerido: number;
  fotoUrl: string | null;
  /** Stock no depósito (central). */
  estoqueCentral: number;
  /** Disponível para pedido no cardápio (stock central > 0). */
  disponivel: boolean;
};

export async function listProdutosCardapio(): Promise<CardapioProduto[]> {
  const rows = await prisma.product.findMany({
    where: { ativo: true },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      marca: true,
      sabor: true,
      categoria: true,
      sku: true,
      precoVendaSugerido: true,
      fotoUrl: true,
      estoqueCentral: true,
    },
  });
  return rows.map((p) => ({
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    sabor: p.sabor,
    categoria: p.categoria,
    sku: p.sku,
    precoVendaSugerido: Number(p.precoVendaSugerido),
    fotoUrl: p.fotoUrl,
    estoqueCentral: p.estoqueCentral,
    disponivel: p.estoqueCentral > 0,
  }));
}

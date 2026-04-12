import { getDetentorEstoqueGeralSellerId } from "@/lib/config/estoque-geral";
import { prisma } from "@/lib/db";

export async function listProdutosAtivos() {
  return prisma.product.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, sku: true, estoqueCentral: true },
  });
}

export async function listProdutosParaFiltro() {
  return prisma.product.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, sku: true },
  });
}

export async function listVendedoresAtivos() {
  return prisma.seller.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}

/** Para comodato: exclui o detentor do estoque geral (não recebe “entrega” por esta tela). */
export async function listVendedoresAtivosParaComodato() {
  const gid = getDetentorEstoqueGeralSellerId();
  return prisma.seller.findMany({
    where: {
      ativo: true,
      ...(gid ? { id: { not: gid } } : {}),
    },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}

export async function listVendedoresParaFiltro() {
  return prisma.seller.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}

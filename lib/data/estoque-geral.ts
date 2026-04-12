import { prisma } from "@/lib/db";
import { getDetentorEstoqueGeralSellerId } from "@/lib/config/estoque-geral";

/** Dados do vendedor configurado como detentor do estoque geral (para textos na UI). */
export async function getDetentorEstoqueGeralInfo() {
  const id = getDetentorEstoqueGeralSellerId();
  if (!id) return null;
  const seller = await prisma.seller.findUnique({
    where: { id },
    select: { id: true, nome: true, ativo: true },
  });
  return seller;
}

export async function getEstoqueGeralHintProps(): Promise<{
  estado: "ok" | "env-invalido" | "sem-env";
  nomeDetentor?: string;
}> {
  const id = getDetentorEstoqueGeralSellerId();
  if (!id) return { estado: "sem-env" };
  const seller = await prisma.seller.findUnique({
    where: { id },
    select: { nome: true },
  });
  if (!seller) return { estado: "env-invalido" };
  return { estado: "ok", nomeDetentor: seller.nome };
}

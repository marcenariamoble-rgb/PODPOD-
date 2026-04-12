import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countNotificacoesCardapioNaoLidas } from "@/lib/data/cardapio-notificacoes";

export const dynamic = "force-dynamic";

/**
 * Contagem de pedidos do cardápio não lidos (vendedor autenticado).
 * Usado para atualizar o badge sem recarregar a página inteira.
 */
export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    session.user.role !== "VENDEDOR" ||
    !session.user.sellerId
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const count = await countNotificacoesCardapioNaoLidas(session.user.sellerId);
  return NextResponse.json({ count });
}

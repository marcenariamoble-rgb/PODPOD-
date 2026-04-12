import Link from "next/link";
import { listSellersParaAlertaCardapio } from "@/lib/data/cardapio-notificacoes";
import { actionDefinirAlertaCardapioVendedor } from "@/app/actions/cardapio-notificacoes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function PedidosCardapioAlertasPage() {
  const sellers = await listSellersParaAlertaCardapio();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/pedidos-cardapio"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-2 inline-flex rounded-lg font-semibold text-primary"
            )}
          >
            ← Pedidos do cardápio
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Notificações para vendedores
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-muted-foreground">
            Escolha quem recebe um alerta na área do vendedor sempre que alguém
            pedir um produto pelo cardápio público. O vendedor pode abrir o
            WhatsApp do cliente a partir do aviso.
          </p>
        </div>
      </div>

      <ul className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        {sellers.length === 0 ? (
          <li className="py-8 text-center text-sm font-medium text-muted-foreground">
            Nenhum vendedor ativo.
          </li>
        ) : (
          sellers.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{s.nome}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.temUsuarioVendedor ? (
                    <span className="font-mono">{s.emailUsuario}</span>
                  ) : (
                    <span>Sem login de vendedor — notificações ficam guardadas até existir conta.</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.recebeAlertaCardapio ? (
                  <Badge className="rounded-lg font-semibold">Recebe alertas</Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-lg font-semibold">
                    Não recebe
                  </Badge>
                )}
                <form action={actionDefinirAlertaCardapioVendedor}>
                  <input type="hidden" name="sellerId" value={s.id} />
                  <input
                    type="hidden"
                    name="ativo"
                    value={s.recebeAlertaCardapio ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant={s.recebeAlertaCardapio ? "outline" : "default"}
                    className="rounded-xl font-semibold"
                  >
                    {s.recebeAlertaCardapio ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

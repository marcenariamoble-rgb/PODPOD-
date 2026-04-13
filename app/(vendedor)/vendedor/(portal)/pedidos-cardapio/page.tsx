import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { listNotificacoesCardapioVendedor } from "@/lib/data/cardapio-notificacoes";
import { buildWhatsAppMeUrl } from "@/lib/utils/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  actionMarcarNotificacaoCardapioLida,
  actionMarcarTodasNotificacoesCardapioLidas,
} from "@/app/actions/cardapio-notificacoes";

export default async function VendedorPedidosCardapioPage() {
  const session = await auth();
  const sellerId = session?.user?.sellerId;
  if (!sellerId) redirect("/vendedor");

  const itens = await listNotificacoesCardapioVendedor(sellerId);
  const naoLidas = itens.filter((i) => !i.lida).length;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/vendedor"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-2 inline-flex rounded-lg font-semibold text-primary"
          )}
        >
          ← Início
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Pedidos do cardápio
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Quando chegar um aviso, pode abrir o WhatsApp do cliente pelo botão em cada pedido.
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          O pedido não baixa seu estoque. A baixa só acontece ao confirmar a venda.
        </p>
      </div>

      {naoLidas > 0 ? (
        <form action={actionMarcarTodasNotificacoesCardapioLidas}>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full rounded-xl font-semibold sm:w-auto"
            )}
          >
            Marcar todas como lidas
          </button>
        </form>
      ) : null}

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Ainda não há pedidos do cardápio para si. Se esperava receber avisos,
            peça à equipa para activar as notificações do seu utilizador.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((n) => {
            const wa = buildWhatsAppMeUrl(n.telefone);
            const contacto =
              [n.nomeContato, n.telefone].filter(Boolean).join(" · ") || "—";
            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-2xl border p-4 shadow-sm",
                  n.lida
                    ? "border-border/60 bg-card/80"
                    : "border-primary/35 bg-primary/[0.06] ring-1 ring-primary/15"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="break-words font-semibold leading-snug text-foreground">
                      {n.produtoNome}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {n.produtoSku}
                    </p>
                  </div>
                  {!n.lida ? (
                    <Badge variant="default" className="shrink-0 rounded-lg font-semibold">
                      Novo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0 rounded-lg">
                      Lido
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs tabular-nums text-muted-foreground">
                  {format(n.createdAt, "d MMM yyyy · HH:mm", { locale: ptBR })} · Qtd.{" "}
                  <span className="font-semibold text-foreground">{n.quantidade}</span>
                </p>
                <p className="mt-2 break-words text-sm text-foreground">
                  <span className="font-medium text-muted-foreground">Contacto: </span>
                  {contacto}
                </p>
                {n.observacoes?.trim() ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium">Obs.: </span>
                    {n.observacoes}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/vendedor/vender?productId=${encodeURIComponent(n.produtoId)}&quantidade=${encodeURIComponent(String(n.quantidade))}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-xl font-semibold"
                    )}
                  >
                    Efetivar venda
                  </Link>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "gap-1.5 rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-600/90 dark:bg-emerald-700 dark:hover:bg-emerald-700/90"
                      )}
                    >
                      <MessageCircle className="size-4" strokeWidth={2.25} />
                      WhatsApp do cliente
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      Sem telefone para WhatsApp
                    </span>
                  )}
                  {!n.lida ? (
                    <form action={actionMarcarNotificacaoCardapioLida}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "rounded-xl font-semibold"
                        )}
                      >
                        Marcar lido
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

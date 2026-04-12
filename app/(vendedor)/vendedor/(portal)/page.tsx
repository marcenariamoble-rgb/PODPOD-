import Link from "next/link";
import { auth } from "@/lib/auth";
import { getVendedorPortalResumo } from "@/lib/data/vendedor-portal";
import { countNotificacoesCardapioNaoLidas } from "@/lib/data/cardapio-notificacoes";
import { formatBRL, formatInt } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, Package, TrendingUp, Wallet } from "lucide-react";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorHomePage() {
  const session = await auth();
  const sellerId = session!.user.sellerId!;
  const [{ seller, stocks, fin, unidades }, pedidosNovos] = await Promise.all([
    getVendedorPortalResumo(sellerId),
    countNotificacoesCardapioNaoLidas(sellerId),
  ]);

  const pendente = fin.saldoPendente > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Olá{seller?.nome ? `, ${seller.nome.split("—")[0].trim()}` : ""}
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Resumo da sua operação
        </p>
      </div>

      {pedidosNovos > 0 ? (
        <Link
          href="/vendedor/pedidos-cardapio"
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border border-primary/35 bg-primary/[0.07] px-4 py-3 shadow-sm transition-colors hover:bg-primary/[0.1]"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bell className="size-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                {pedidosNovos === 1
                  ? "Novo pedido no cardápio"
                  : `${pedidosNovos} novos pedidos no cardápio`}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Abra para ver o contacto e falar com o cliente no WhatsApp.
              </p>
            </div>
          </div>
          <Badge className="shrink-0 rounded-lg font-semibold">Ver</Badge>
        </Link>
      ) : null}

      <div className="grid gap-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Unidades em posse
            </p>
            <Package className="size-5 text-primary" />
          </div>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
            {formatInt(unidades)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stocks.length} tipo(s) de produto
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Total vendido (cliente)
            </p>
            <TrendingUp className="size-5 text-success" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
            {formatBRL(fin.totalVendas)}
          </p>
          {fin.totalComissaoRetida > 0 ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Comissão já retida: {formatBRL(fin.totalComissaoRetida)}
            </p>
          ) : null}
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            A repassar à empresa: {formatBRL(fin.totalSaldoRepasse)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
            pendente
              ? "border-warning/45 ring-1 ring-warning/20"
              : "border-border/70"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Saldo a repassar (pendente)
            </p>
            <Wallet className="size-5 text-warning" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
            {formatBRL(fin.saldoPendente)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Já repassado: {formatBRL(fin.totalRecebido)}
          </p>
          {pendente ? (
            <Badge variant="warning" className="mt-2 font-semibold">
              Pendência em aberto
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/vendedor/vender"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-12 w-full justify-center rounded-2xl text-base font-semibold"
          )}
        >
          Registrar venda
        </Link>
        <Link
          href="/vendedor/estoque"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center rounded-2xl border-primary/25 text-base font-semibold"
          )}
        >
          Ver meu estoque
        </Link>
      </div>

      {stocks.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top itens
          </p>
          <ul className="mt-2 space-y-2">
            {stocks.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex justify-between text-sm font-medium"
              >
                <span className="truncate pr-2">{s.product.nome}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {s.quantidade} u.
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <PodPodEmptyHint className="border-border/60 bg-muted/15">
          Você ainda não tem produtos em comodato. Peça uma entrega ao
          responsável pela operação.
        </PodPodEmptyHint>
      )}
    </div>
  );
}

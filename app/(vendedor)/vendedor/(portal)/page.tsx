import Link from "next/link";
import { auth } from "@/lib/auth";
import { getVendedorPortalResumo } from "@/lib/data/vendedor-portal";
import { countNotificacoesCardapioNaoLidas } from "@/lib/data/cardapio-notificacoes";
import { formatBRL, formatInt } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, Package, Wallet } from "lucide-react";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorHomePage() {
  const session = await auth();
  const sellerId = session!.user.sellerId!;
  const [{ seller, stocks, fin, unidades }, pedidosNovos] = await Promise.all([
    getVendedorPortalResumo(sellerId),
    countNotificacoesCardapioNaoLidas(sellerId),
  ]);

  const temPendenciaRepasse = fin.saldoPendente > 0;

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="break-words font-heading text-2xl font-bold tracking-tight">
          Olá{seller?.nome ? `, ${seller.nome.split("—")[0].trim()}` : ""}
        </h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          O seu estoque, vendas e pedidos do cardápio
        </p>
        {seller?.codigoVenda ? (
          <p className="mt-2 max-w-xl rounded-xl border border-border/70 bg-muted/25 px-3 py-2 text-xs font-medium leading-relaxed text-muted-foreground">
            <span className="text-foreground">Indicação direta: </span>
            partilhe o link{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
              /cardapio?codigo={seller.codigoVenda}
            </code>{" "}
            — só o seu painel recebe o aviso dos pedidos feitos com este código.
          </p>
        ) : null}
      </div>

      {pedidosNovos > 0 ? (
        <Link
          href="/vendedor/pedidos-cardapio"
          className={cn(
            "flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-primary/35 bg-primary/[0.07] px-4 py-3 shadow-sm transition-colors hover:bg-primary/[0.1]"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
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
              Unidades na sua posse
            </p>
            <Package className="size-5 shrink-0 text-primary" />
          </div>
          <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
            {formatInt(unidades)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stocks.length === 0
              ? "Nenhum produto em comodato"
              : stocks.length === 1
                ? "1 tipo de produto"
                : `${stocks.length} tipos de produto`}
          </p>
        </div>

        <div
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]",
            temPendenciaRepasse
              ? "border-warning/45 ring-1 ring-warning/20"
              : "border-border/70"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-muted-foreground">
              Valor a repassar (pendente)
            </p>
            <Wallet className="size-5 shrink-0 text-warning" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
            {formatBRL(fin.saldoPendente)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Já repassado (registado): {formatBRL(fin.totalRecebido)}
          </p>
          {temPendenciaRepasse ? (
            <Badge variant="warning" className="mt-2 font-semibold">
              Pendente com a empresa
            </Badge>
          ) : (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Sem valor pendente de repasse.
            </p>
          )}
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
        <Link
          href="/vendedor/historico"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center rounded-2xl border-border/80 text-base font-semibold"
          )}
        >
          Ver histórico
        </Link>
        <Link
          href="/vendedor/pedidos-cardapio"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center rounded-2xl border-border/80 text-base font-semibold"
          )}
        >
          Pedidos do cardápio
        </Link>
        {seller?.consumoProprioHabilitado ? (
          <Link
            href="/vendedor/consumo-proprio"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full justify-center rounded-2xl border-border/80 text-base font-semibold"
            )}
          >
            Consumo próprio
          </Link>
        ) : null}
      </div>

      {stocks.length === 0 ? (
        <PodPodEmptyHint className="border-border/60 bg-muted/15">
          Quando receber produtos em comodato, eles aparecem aqui e em Estoque.
        </PodPodEmptyHint>
      ) : null}
    </div>
  );
}

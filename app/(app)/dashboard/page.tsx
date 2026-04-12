import Link from "next/link";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Package,
  Users,
  Warehouse,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/dashboard-client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getDashboardKpis } from "@/lib/services/dashboard.service";
import {
  estoquePorVendedor,
  recebimentosPorDiaNoPeriodo,
  vendasPorProdutoNoPeriodo,
  vendasPorVendedorNoPeriodo,
} from "@/lib/services/charts.service";
import { formatBRL, formatInt } from "@/lib/utils/format";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const [kpis, vv, vp, rd, ev, pedidosCardapioNovos] = await Promise.all([
    getDashboardKpis(from, to),
    vendasPorVendedorNoPeriodo(from, to),
    vendasPorProdutoNoPeriodo(from, to),
    recebimentosPorDiaNoPeriodo(from, to),
    estoquePorVendedor(),
    // Cliente Prisma em memória pode estar desatualizado até reiniciar o `next dev`.
    (prisma.solicitacaoCardapio?.count({
      where: { visualizado: false },
    }) ?? Promise.resolve(0)),
  ]);

  const periodoLabel = `${format(from, "d MMM", { locale: ptBR })} — ${format(to, "d MMM yyyy", { locale: ptBR })}`;
  const alertaEstoque = kpis.produtosEstoqueBaixo > 0;

  return (
    <div className="flex w-full flex-col gap-8 md:gap-10">
      <header className="flex flex-col gap-5 border-b border-border/60 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-lg border-0 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              Visão geral
            </Badge>
            {alertaEstoque ? (
              <Badge variant="warning" className="rounded-lg font-semibold">
                {kpis.produtosEstoqueBaixo} produto(s) com estoque baixo
              </Badge>
            ) : null}
            {pedidosCardapioNovos > 0 ? (
              <Link href="/pedidos-cardapio">
                <Badge
                  variant="default"
                  className="rounded-lg border-0 font-semibold shadow-sm"
                >
                  {pedidosCardapioNovos} pedido(s) do cardápio
                </Badge>
              </Link>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Painel
          </h1>
          <p className="max-w-xl text-sm font-medium text-muted-foreground sm:text-base">
            Período:{" "}
            <span className="text-foreground">{periodoLabel}</span>
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/comodato"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "min-h-11 gap-2 rounded-xl border-primary/20 bg-card px-5 font-semibold shadow-sm hover:border-primary/35 hover:bg-primary/5"
            )}
          >
            <Truck className="size-[18px] text-primary" strokeWidth={2.25} />
            Comodato
          </Link>
          <Link
            href="/vendas/nova"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-h-11 gap-2 rounded-xl px-6 font-semibold"
            )}
          >
            <ShoppingCart className="size-[18px]" strokeWidth={2.25} />
            Nova venda
          </Link>
          <Link
            href="/vendas"
            className={cn(
              buttonVariants({ size: "lg", variant: "ghost" }),
              "min-h-11 rounded-xl px-4 font-semibold text-primary"
            )}
          >
            Painel de vendas
          </Link>
        </div>
      </header>

      <section aria-label="Indicadores principais">
        <h2 className="sr-only">Indicadores principais</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Estoque central"
            value={formatInt(kpis.estoqueCentralTotal)}
            sublabel="Unidades no depósito"
            icon={Warehouse}
            tone="default"
          />
          <KpiCard
            label="Em posse"
            value={formatInt(kpis.estoqueEmPosseVendedores)}
            sublabel="Com vendedores (comodato)"
            icon={Users}
            tone="default"
          />
          <KpiCard
            label="Vendido no período"
            value={formatBRL(kpis.totalVendidoPeriodo)}
            sublabel="Faturamento registrado"
            icon={TrendingUp}
            tone="success"
          />
          <KpiCard
            label="Financeiro"
            value={formatBRL(kpis.valorTotalAReceber)}
            sublabel={
              <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-success/12 px-2 py-0.5 text-success">
                  Recebido {formatBRL(kpis.totalJaRecebido)}
                </span>
                <span className="text-muted-foreground">saldo em aberto acima</span>
              </span>
            }
            icon={Wallet}
            tone="finance"
          />
        </div>
      </section>

      <section aria-label="Resumo operacional">
        <h2 className="mb-4 font-heading text-lg font-semibold tracking-tight text-foreground">
          Resumo operacional
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Produtos ativos"
            value={formatInt(kpis.totalProdutosCadastrados)}
            icon={Package}
            tone="default"
          />
          <KpiCard
            label="Vendedores ativos"
            value={formatInt(kpis.vendedoresAtivos)}
            icon={Users}
            tone="default"
          />
          <KpiCard
            label="Alertas de estoque"
            value={formatInt(kpis.produtosEstoqueBaixo)}
            sublabel="Itens no central ≤ estoque mínimo"
            icon={AlertTriangle}
            tone="warning"
            highlight={alertaEstoque}
            className="sm:col-span-2 xl:col-span-1"
          />
        </div>
      </section>

      <section aria-label="Gráficos" className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Análises
          </h2>
          <p className="text-sm text-muted-foreground">
            Vendas, recebimentos e distribuição no período atual.
          </p>
        </div>
        <DashboardCharts
          vendasVendedor={vv}
          vendasProduto={vp}
          recebimentosDia={rd}
          estoqueVendedor={ev}
        />
      </section>
    </div>
  );
}

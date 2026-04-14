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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const [kpis, vv, vp, rd, ev, pedidosCardapioNovos, produtosEstoque, vendedoresEstoque] =
    await Promise.all([
    getDashboardKpis(from, to),
    vendasPorVendedorNoPeriodo(from, to),
    vendasPorProdutoNoPeriodo(from, to),
    recebimentosPorDiaNoPeriodo(from, to),
    estoquePorVendedor(),
    prisma.solicitacaoCardapio.count({
      where: { visualizado: false },
    }),
    prisma.product.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        sku: true,
        marca: true,
        sabor: true,
        estoqueCentral: true,
        precoVendaSugerido: true,
        sellerStocks: {
          where: { quantidade: { gt: 0 } },
          select: { quantidade: true },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.seller.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        sellerStocks: {
          where: { quantidade: { gt: 0 } },
          select: {
            quantidade: true,
            product: { select: { precoVendaSugerido: true } },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  const produtosResumo = produtosEstoque
    .map((p) => {
      const emPosse = p.sellerStocks.reduce((acc, s) => acc + s.quantidade, 0);
      const total = p.estoqueCentral + emPosse;
      const valorTotalSugerido = Number(p.precoVendaSugerido) * total;
      return {
        id: p.id,
        nome: p.nome,
        sku: p.sku,
        marca: p.marca,
        sabor: p.sabor,
        central: p.estoqueCentral,
        emPosse,
        total,
        valorTotalSugerido,
      };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  const vendedoresResumo = vendedoresEstoque
    .map((v) => {
      const unidades = v.sellerStocks.reduce((acc, row) => acc + row.quantidade, 0);
      const valorEstimado = v.sellerStocks.reduce(
        (acc, row) => acc + Number(row.product.precoVendaSugerido) * row.quantidade,
        0
      );
      return {
        id: v.id,
        nome: v.nome,
        unidades,
        valorEstimado,
      };
    })
    .sort((a, b) => {
      if (b.unidades !== a.unidades) return b.unidades - a.unidades;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

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

      <section aria-label="Controle administrativo de estoque" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Controle administrativo de estoque
            </h2>
            <p className="text-sm text-muted-foreground">
              Saldo por produto, distribuição por vendedor e valores para decisão rápida.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/comodato/estoque"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
            >
              Ver comodato
            </Link>
            <Link href="/produtos" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}>
              Ver produtos
            </Link>
            <Link href="/movimentacoes" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}>
              Ver movimentações
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="font-semibold">Produtos (maior volume no topo)</p>
              <p className="text-xs text-muted-foreground">
                Central, em posse e valor estimado total.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Central</TableHead>
                  <TableHead className="text-right">Em posse</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosResumo.slice(0, 12).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/produtos/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.nome}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.marca}
                        {p.sabor ? ` · ${p.sabor}` : ""} · {p.sku}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatInt(p.central)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatInt(p.emPosse)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatInt(p.total)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {formatBRL(p.valorTotalSugerido)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/60 px-4 py-3">
              <p className="font-semibold">Estoque por vendedor</p>
              <p className="text-xs text-muted-foreground">
                Quantidade em posse e valor potencial pelos preços sugeridos.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Valor estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedoresResumo.slice(0, 12).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Link href={`/vendedores/${v.id}`} className="font-medium text-primary hover:underline">
                        {v.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatInt(v.unidades)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(v.valorEstimado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}

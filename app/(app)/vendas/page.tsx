import Link from "next/link";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeftRight,
  ArrowRight,
  ShoppingCart,
  Undo2,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getDashboardKpis } from "@/lib/services/dashboard.service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const acoes = [
  {
    href: "/vendas/nova",
    title: "Nova venda",
    description:
      "Registar venda do vendedor: baixa na posse, valor e forma de pagamento.",
    icon: ShoppingCart,
    emphasis: true as const,
  },
  {
    href: "/devolucoes/nova",
    title: "Corrigir ou anular",
    description:
      "Anular venda errada, devolução física ou ajuste sem apagar histórico.",
    icon: Undo2,
    emphasis: false as const,
  },
  {
    href: "/recebimentos/nova",
    title: "Recebimento",
    description:
      "Registar o que o vendedor repassa à empresa (saldo das vendas).",
    icon: Wallet,
    emphasis: false as const,
  },
  {
    href: "/consumo-proprio",
    title: "Consumo próprio",
    description:
      "Separar o consumo dos vendedores (cobrança a custo) das vendas ao cliente.",
    icon: Wallet,
    emphasis: false as const,
  },
  {
    href: "/movimentacoes?tipo=VENDA",
    title: "Movimentações de vendas",
    description: "Filtrar o histórico só por lançamentos do tipo venda.",
    icon: ArrowLeftRight,
    emphasis: false as const,
  },
];

export default async function VendasPainelPage() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const periodoLabel = `${format(from, "d MMM", { locale: ptBR })} — ${format(to, "d MMM yyyy", { locale: ptBR })}`;

  const [kpis, recentes, numVendasMes] = await Promise.all([
    getDashboardKpis(from, to),
    prisma.venda.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { vendedor: true, produto: true },
    }),
    prisma.venda.count({
      where: { createdAt: { gte: from, lte: to } },
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Vendas
          </h1>
          <p className="max-w-xl text-sm font-medium text-muted-foreground">
            Tudo o que precisa para lançar vendas, corrigir registos e acompanhar
            repasses — num só sítio.
          </p>
          <p className="text-xs font-medium text-muted-foreground/90">
            Resumo do mês: <span className="text-foreground">{periodoLabel}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/vendas/nova"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 gap-2 rounded-xl px-6 font-semibold"
            )}
          >
            <ShoppingCart className="size-[18px]" strokeWidth={2.25} />
            Nova venda
          </Link>
          <Link
            href="/financeiro"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "h-11 rounded-xl px-5 font-semibold"
            )}
          >
            Contas &amp; setores
          </Link>
        </div>
      </header>

      <section
        aria-label="Indicadores do mês"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vendas no período
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
            {numVendasMes}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">registos</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total vendido (bruto)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatBRL(kpis.totalVendidoPeriodo)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">no mês corrente</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            A receber (global)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatBRL(kpis.valorTotalAReceber)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Saldo em aberto dos vendedores
          </p>
        </div>
      </section>

      <section aria-label="Atalhos">
        <h2 className="mb-3 font-heading text-lg font-semibold tracking-tight">
          O que pretende fazer?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {acoes.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={cn(
                  "group flex gap-3 rounded-2xl border p-4 text-left transition-all",
                  a.emphasis
                    ? "border-primary/35 bg-primary/5 shadow-sm hover:border-primary/50 hover:bg-primary/10"
                    : "border-border/70 bg-card shadow-[var(--shadow-card)] hover:border-primary/25"
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    a.emphasis
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-foreground">
                    {a.title}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                    Abrir
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="overflow-hidden border-border/70 shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/20 py-4">
          <CardTitle className="text-base font-semibold">
            Últimas vendas registadas
          </CardTitle>
          <Link
            href="/movimentacoes?tipo=VENDA"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-lg font-semibold"
            )}
          >
            Ver no histórico
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentes.length === 0 ? (
            <p className="p-6 text-sm font-medium text-muted-foreground">
              Ainda não há vendas registadas. Comece por{" "}
              <Link href="/vendas/nova" className="font-semibold text-primary underline">
                nova venda
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentes.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap text-xs tabular-nums">
                        {format(v.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{v.vendedor.nome}</TableCell>
                      <TableCell className="max-w-[10rem] truncate text-sm">
                        {v.produto.nome}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.quantidade}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatBRL(Number(v.valorTotal))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

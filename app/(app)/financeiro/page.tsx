import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import {
  endOfDay,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getGlobalFinancialTotals,
  sumRecebimentosNoPeriodo,
  sumVendasNoPeriodo,
} from "@/lib/services/calculations.service";
import {
  aggregateFinanceiroPorRegiao,
  listFinanceiroPorVendedor,
  listVendasAgregadasPorCategoria,
} from "@/lib/services/financeiro-painel.service";
import { FinanceiroPainelTabs } from "@/components/financeiro/financeiro-painel-tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";

function parsePeriod(
  sp: Record<string, string | string[] | undefined>
): { from: Date; to: Date } {
  const now = new Date();
  let from = startOfMonth(now);
  let to = endOfMonth(now);

  const de = typeof sp.de === "string" ? sp.de : undefined;
  const ate = typeof sp.ate === "string" ? sp.ate : undefined;

  if (de) {
    const p = parseISO(de);
    if (isValid(p)) from = startOfDay(p);
  }
  if (ate) {
    const p = parseISO(ate);
    if (isValid(p)) to = endOfDay(p);
  }
  if (from.getTime() > to.getTime()) {
    return { from: to, to: from };
  }
  return { from, to };
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();
  const sp = await searchParams;
  const { from, to } = parsePeriod(sp);

  const [
    global,
    vendasPeriodo,
    recebimentosPeriodo,
    vendedoresRaw,
    categorias,
  ] = await Promise.all([
    getGlobalFinancialTotals(),
    sumVendasNoPeriodo(from, to),
    sumRecebimentosNoPeriodo(from, to),
    listFinanceiroPorVendedor(),
    listVendasAgregadasPorCategoria(),
  ]);

  const vendedores = [...vendedoresRaw].sort(
    (a, b) => b.saldoPendente - a.saldoPendente
  );
  const regioes = aggregateFinanceiroPorRegiao(vendedoresRaw);

  const periodoLabel = `${format(from, "dd/MM/yyyy", { locale: ptBR })} — ${format(to, "dd/MM/yyyy", { locale: ptBR })}`;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Financeiro
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
            Visão consolidada: saldos com vendedores, vendas por categoria e por
            região. Use o período para analisar fluxo de vendas e recebimentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/recebimentos/nova"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Novo recebimento
          </Link>
          <Link
            href="/vendas"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Painel de vendas
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-end"
      >
        <Field label="De" htmlFor="fin-de" className="min-w-[160px]">
          <input
            id="fin-de"
            name="de"
            type="date"
            defaultValue={format(from, "yyyy-MM-dd")}
            className={nativeSelectClassName}
          />
        </Field>
        <Field label="Até" htmlFor="fin-ate" className="min-w-[160px]">
          <input
            id="fin-ate"
            name="ate"
            type="date"
            defaultValue={format(to, "yyyy-MM-dd")}
            className={nativeSelectClassName}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" className="rounded-xl font-semibold">
            Aplicar período
          </Button>
          <Link
            href="/financeiro"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-xl font-semibold text-primary"
            )}
          >
            Mês atual
          </Link>
        </div>
      </form>

      <FinanceiroPainelTabs
        resumo={{
          global,
          vendasPeriodo,
          recebimentosPeriodo,
          periodoLabel,
        }}
        vendedores={vendedores}
        categorias={categorias}
        regioes={regioes}
      />
    </div>
  );
}

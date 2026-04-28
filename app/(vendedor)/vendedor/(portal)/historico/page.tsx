import { auth } from "@/lib/auth";
import {
  listHistoricoVendedor,
  type VendedorHistoricoTipoFiltro,
} from "@/lib/data/vendedor-portal";
import { formatBRL } from "@/lib/utils/format";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { headers } from "next/headers";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  CalendarClock,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

const tipoOptions: Array<{ value: VendedorHistoricoTipoFiltro; label: string }> = [
  { value: "TODOS", label: "Todos" },
  { value: "PAGAMENTO", label: "Pagamento" },
  { value: "COMODATO", label: "Comodato" },
  { value: "DEBITO_BRUTO", label: "Débito bruto" },
  { value: "DEBITO_LIQUIDO", label: "Débito líquido" },
  { value: "VENDA", label: "Vendas" },
  { value: "RECEBIMENTO", label: "Pagamentos (repasses)" },
  { value: "ENTREGA_COMODATO", label: "Comodato recebido" },
  { value: "DEVOLUCAO", label: "Devoluções" },
  { value: "ESTORNO_VENDA", label: "Estornos de venda" },
  { value: "PERDA", label: "Perdas / avarias" },
  { value: "AJUSTE", label: "Ajustes de estoque" },
];

function badgeLabel(tipo: VendedorHistoricoTipoFiltro) {
  const map: Record<VendedorHistoricoTipoFiltro, string> = {
    TODOS: "Todos",
    PAGAMENTO: "Pagamento",
    COMODATO: "Comodato",
    DEBITO_BRUTO: "Débito bruto",
    DEBITO_LIQUIDO: "Débito líquido",
    VENDA: "Venda",
    RECEBIMENTO: "Pagamento",
    ENTREGA_COMODATO: "Comodato",
    DEVOLUCAO: "Devolução",
    ESTORNO_VENDA: "Estorno",
    PERDA: "Perda",
    AJUSTE: "Ajuste",
  };
  return map[tipo];
}

function sectionLabel(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function tipoUi(tipo: VendedorHistoricoTipoFiltro) {
  switch (tipo) {
    case "VENDA":
      return {
        icon: ArrowUpRight,
        badgeClass: "border-emerald-300/60 bg-emerald-500/10 text-emerald-700",
        cardClass: "border-emerald-300/45 bg-emerald-500/[0.03]",
      };
    case "RECEBIMENTO":
      return {
        icon: ArrowDownLeft,
        badgeClass: "border-violet-300/60 bg-violet-500/10 text-violet-700",
        cardClass: "border-violet-300/45 bg-violet-500/[0.03]",
      };
    case "ENTREGA_COMODATO":
      return {
        icon: Box,
        badgeClass: "border-sky-300/60 bg-sky-500/10 text-sky-700",
        cardClass: "border-sky-300/45 bg-sky-500/[0.03]",
      };
    case "DEVOLUCAO":
      return {
        icon: RotateCcw,
        badgeClass: "border-cyan-300/60 bg-cyan-500/10 text-cyan-700",
        cardClass: "border-cyan-300/45 bg-cyan-500/[0.03]",
      };
    case "ESTORNO_VENDA":
      return {
        icon: ShieldAlert,
        badgeClass: "border-rose-300/60 bg-rose-500/10 text-rose-700",
        cardClass: "border-rose-300/45 bg-rose-500/[0.03]",
      };
    case "PERDA":
      return {
        icon: ShieldAlert,
        badgeClass: "border-red-300/60 bg-red-500/10 text-red-700",
        cardClass: "border-red-300/45 bg-red-500/[0.03]",
      };
    default:
      return {
        icon: SlidersHorizontal,
        badgeClass: "border-amber-300/60 bg-amber-500/10 text-amber-700",
        cardClass: "border-amber-300/45 bg-amber-500/[0.03]",
      };
  }
}

export default async function VendedorHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    de?: string;
    ate?: string;
    page?: string;
    modo?: "resumido" | "detalhado";
  }>;
}) {
  const session = await auth();
  const sellerId = session!.user.sellerId!;
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page ?? "1")) || 1);
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobileUa =
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua);
  const modo =
    sp.modo === "resumido" || sp.modo === "detalhado"
      ? sp.modo
      : isMobileUa
        ? "resumido"
        : "detalhado";
  const tipo =
    tipoOptions.some((t) => t.value === sp.tipo) && sp.tipo
      ? (sp.tipo as VendedorHistoricoTipoFiltro)
      : "TODOS";

  const historico = await listHistoricoVendedor(sellerId, {
    tipo,
    de: sp.de,
    ate: sp.ate,
    page,
    perPage: 20,
  });
  const q = new URLSearchParams();
  if (tipo !== "TODOS") q.set("tipo", tipo);
  if (sp.de) q.set("de", sp.de);
  if (sp.ate) q.set("ate", sp.ate);
  if (modo === "resumido") q.set("modo", "resumido");
  const grouped = historico.items.reduce<Array<{ label: string; items: typeof historico.items }>>(
    (acc, item) => {
      const label = sectionLabel(item.createdAt);
      const last = acc[acc.length - 1];
      if (!last || last.label !== label) {
        acc.push({ label, items: [item] });
      } else {
        last.items.push(item);
      }
      return acc;
    },
    []
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe vendas, comodato, pagamentos e outras movimentações da sua conta.
        </p>
      </div>

      <form method="get" className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
        {modo === "resumido" ? <input type="hidden" name="modo" value="resumido" /> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Tipo" htmlFor="f-tipo">
            <select
              id="f-tipo"
              name="tipo"
              defaultValue={tipo}
              className={nativeSelectClassName}
            >
              {tipoOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="De" htmlFor="f-de">
            <input
              id="f-de"
              name="de"
              type="date"
              defaultValue={sp.de ?? ""}
              className={nativeSelectClassName}
            />
          </Field>
          <Field label="Até" htmlFor="f-ate">
            <input
              id="f-ate"
              name="ate"
              type="date"
              defaultValue={sp.ate ?? ""}
              className={nativeSelectClassName}
            />
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="rounded-xl font-semibold">
            Aplicar filtros
          </Button>
          <Link
            href="/vendedor/historico"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
          >
            Limpar
          </Link>
          <Link
            href={`/vendedor/historico?${(() => {
              const next = new URLSearchParams(q.toString());
              if (modo === "resumido") next.delete("modo");
              else next.set("modo", "resumido");
              next.delete("page");
              return next.toString();
            })()}`}
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-xl")}
          >
            {modo === "resumido" ? "Modo detalhado" : "Modo resumido"}
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vendas no período
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-foreground">
            {formatBRL(historico.resumo.totalVendas)}
          </p>
          <p className="text-xs text-muted-foreground">
            {historico.resumo.quantidadeVendas} lançamento(s)
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pagamentos no período
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-foreground">
            {formatBRL(historico.resumo.totalRecebimentos)}
          </p>
          <p className="text-xs text-muted-foreground">
            {historico.resumo.quantidadeRecebimentos} lançamento(s)
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Saldo do período
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-foreground">
            {formatBRL(historico.resumo.saldoPeriodo)}
          </p>
          <p className="text-xs text-muted-foreground">Vendas - pagamentos</p>
        </div>
      </div>

      <div className="space-y-4">
        {historico.items.length === 0 ? (
          <PodPodEmptyHint className="border-border/60 bg-muted/15">
            Nenhum registro encontrado para os filtros selecionados.
          </PodPodEmptyHint>
        ) : (
          grouped.map((group) => (
            <section key={group.label} className="space-y-2.5">
              <div className="sticky top-[5.25rem] z-10 -mx-1 rounded-lg bg-background/90 px-1 py-1 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
              </div>
              {group.items.map((item) => {
                const ui = tipoUi(item.kind);
                const Icon = ui.icon;
                return (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 shadow-[var(--shadow-card)]",
                      ui.cardClass
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-background/70">
                          <Icon className="size-4" />
                        </span>
                        <Badge variant="outline" className={ui.badgeClass}>
                          {badgeLabel(item.kind)}
                        </Badge>
                      </div>
                      <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <CalendarClock className="size-3.5" />
                        {format(item.createdAt, "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{item.titulo}</p>
                    {modo === "resumido" ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.valor != null ? (
                          <span className="font-semibold text-foreground">
                            {formatBRL(item.valor)}
                          </span>
                        ) : null}
                        {item.quantidade != null ? <span>{item.quantidade} un.</span> : null}
                        {item.formaPagamento ? <span>{item.formaPagamento}</span> : null}
                      </div>
                    ) : (
                      <>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.descricao}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {item.valor != null ? (
                            <span className="font-medium text-foreground">
                              Valor: {formatBRL(item.valor)}
                            </span>
                          ) : null}
                          {item.formaPagamento ? <span>Pagamento: {item.formaPagamento}</span> : null}
                          {item.quantidade != null ? <span>Quantidade: {item.quantidade}</span> : null}
                        </div>
                        {item.observacoes ? (
                          <p className="mt-2 rounded-lg bg-muted/35 px-2.5 py-2 text-xs text-muted-foreground">
                            {item.observacoes}
                          </p>
                        ) : null}
                      </>
                    )}
                  </article>
                );
              })}
            </section>
          ))
        )}
      </div>
      {historico.hasMore ? (
        <div className="flex justify-center">
          <Link
            href={`/vendedor/historico?${(() => {
              const next = new URLSearchParams(q.toString());
              next.set("page", String(page + 1));
              return next.toString();
            })()}`}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl font-semibold")}
          >
            Carregar mais
          </Link>
        </div>
      ) : null}
    </div>
  );
}

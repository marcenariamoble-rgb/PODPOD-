import { auth } from "@/lib/auth";
import {
  listHistoricoVendedor,
  type VendedorHistoricoTipoFiltro,
} from "@/lib/data/vendedor-portal";
import { formatBRL } from "@/lib/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

const tipoOptions: Array<{ value: VendedorHistoricoTipoFiltro; label: string }> = [
  { value: "TODOS", label: "Todos" },
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

export default async function VendedorHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; de?: string; ate?: string }>;
}) {
  const session = await auth();
  const sellerId = session!.user.sellerId!;
  const sp = await searchParams;
  const tipo =
    tipoOptions.some((t) => t.value === sp.tipo) && sp.tipo
      ? (sp.tipo as VendedorHistoricoTipoFiltro)
      : "TODOS";

  const items = await listHistoricoVendedor(sellerId, {
    tipo,
    de: sp.de,
    ate: sp.ate,
    take: 250,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe vendas, comodato, pagamentos e outras movimentações da sua conta.
        </p>
      </div>

      <form method="get" className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
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
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <PodPodEmptyHint className="border-border/60 bg-muted/15">
            Nenhum registro encontrado para os filtros selecionados.
          </PodPodEmptyHint>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">{badgeLabel(item.kind)}</Badge>
                <p className="text-xs font-medium text-muted-foreground">
                  {format(item.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{item.titulo}</p>
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
            </article>
          ))
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { RecebimentosTable } from "@/components/financeiro/recebimentos-table";
import { listVendedoresParaFiltro } from "@/lib/data/catalog";
import {
  listRecebimentosAdmin,
  type RecebimentoOrigemFiltro,
} from "@/lib/services/recebimentos.service";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Plus, Wallet } from "lucide-react";

const origemValues: RecebimentoOrigemFiltro[] = ["todos", "manual", "estorno"];

function parseOrigem(raw: string | undefined): RecebimentoOrigemFiltro {
  if (raw && origemValues.includes(raw as RecebimentoOrigemFiltro)) {
    return raw as RecebimentoOrigemFiltro;
  }
  return "todos";
}

function buildQueryString(sp: {
  vendedorId?: string;
  de?: string;
  ate?: string;
  origem?: string;
  page?: string;
}) {
  const q = new URLSearchParams();
  if (sp.vendedorId) q.set("vendedorId", sp.vendedorId);
  if (sp.de) q.set("de", sp.de);
  if (sp.ate) q.set("ate", sp.ate);
  if (sp.origem && sp.origem !== "todos") q.set("origem", sp.origem);
  if (sp.page && sp.page !== "1") q.set("page", sp.page);
  return q.toString();
}

export default async function RecebimentosPage({
  searchParams,
}: {
  searchParams: Promise<{
    vendedorId?: string;
    de?: string;
    ate?: string;
    origem?: string;
    page?: string;
    ok?: string;
  }>;
}) {
  noStore();
  const sp = await searchParams;
  const origem = parseOrigem(sp.origem);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [result, vendedores] = await Promise.all([
    listRecebimentosAdmin({
      vendedorId: sp.vendedorId,
      de: sp.de,
      ate: sp.ate,
      origem,
      page,
    }),
    listVendedoresParaFiltro(),
  ]);

  const qBase = buildQueryString({
    vendedorId: sp.vendedorId,
    de: sp.de,
    ate: sp.ate,
    origem: origem !== "todos" ? origem : undefined,
  });
  const novaHref = sp.vendedorId
    ? `/recebimentos/nova?vendedorId=${encodeURIComponent(sp.vendedorId)}`
    : "/recebimentos/nova";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Recebimentos
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Histórico do que os vendedores repassam à empresa. Registos automáticos de
            estorno aparecem com a etiqueta &quot;Estorno&quot;.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={novaHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <Plus className="mr-1.5 size-4" />
            Novo recebimento
          </Link>
          <Link
            href="/financeiro"
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <Wallet className="mr-1.5 size-4" />
            Financeiro
          </Link>
        </div>
      </div>

      {sp.ok === "1" ? (
        <FormSuccessBanner message="Recebimento registado com sucesso." />
      ) : null}

      <form
        method="get"
        className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Vendedor" htmlFor="rec-vend">
            <select
              id="rec-vend"
              name="vendedorId"
              defaultValue={sp.vendedorId ?? ""}
              className={nativeSelectClassName}
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="De" htmlFor="rec-de">
            <input
              id="rec-de"
              name="de"
              type="date"
              defaultValue={sp.de ?? ""}
              className={nativeSelectClassName}
            />
          </Field>
          <Field label="Até" htmlFor="rec-ate">
            <input
              id="rec-ate"
              name="ate"
              type="date"
              defaultValue={sp.ate ?? ""}
              className={nativeSelectClassName}
            />
          </Field>
          <Field label="Origem" htmlFor="rec-origem">
            <select
              id="rec-origem"
              name="origem"
              defaultValue={origem}
              className={nativeSelectClassName}
            >
              <option value="todos">Todos</option>
              <option value="manual">Só manuais</option>
              <option value="estorno">Só estorno</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" className="rounded-xl font-semibold">
            Aplicar filtros
          </Button>
          <Link
            href="/recebimentos"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{result.total}</span>{" "}
          {result.total === 1 ? "registo" : "registos"}
          {qBase ? " (filtro aplicado)" : ""}
        </p>
        <p className="text-sm font-medium">
          Total filtrado:{" "}
          <span className="font-heading text-lg font-bold tabular-nums text-foreground">
            {formatBRL(result.totalValor)}
          </span>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <RecebimentosTable rows={result.rows} />
      </div>

      {result.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {page > 1 ? (
            <Link
              href={`/recebimentos?${buildQueryString({ ...sp, page: String(page - 1) })}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl font-semibold"
              )}
            >
              Anterior
            </Link>
          ) : null}
          <span className="px-2 text-sm font-medium text-muted-foreground">
            Página {page} de {result.totalPages}
          </span>
          {page < result.totalPages ? (
            <Link
              href={`/recebimentos?${buildQueryString({ ...sp, page: String(page + 1) })}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl font-semibold"
              )}
            >
              Seguinte
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

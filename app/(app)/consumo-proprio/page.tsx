import Link from "next/link";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { formatBRL, formatInt } from "@/lib/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseDateStart(raw: string | undefined, fallback: Date): Date {
  if (!raw) return fallback;
  const d = new Date(`${raw}T00:00:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function parseDateEnd(raw: string | undefined, fallback: Date): Date {
  if (!raw) return fallback;
  const d = new Date(`${raw}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function ConsumoProprioAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ vendedorId?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const fromDefault = startOfMonth(now);
  const toDefault = endOfMonth(now);
  const from = parseDateStart(sp.from, fromDefault);
  const to = parseDateEnd(sp.to, toDefault);
  const vendedorId = (sp.vendedorId ?? "").trim() || undefined;

  const [sellers, rows] = await Promise.all([
    prisma.seller.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.venda.findMany({
      where: {
        formaPagamento: "CONSUMO_PROPRIO",
        createdAt: { gte: from, lte: to },
        ...(vendedorId ? { vendedorId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        vendedor: { select: { id: true, nome: true } },
        produto: { select: { id: true, nome: true, sku: true } },
      },
      take: 500,
    }),
  ]);

  const totalQtd = rows.reduce((acc, r) => acc + r.quantidade, 0);
  const totalValor = rows.reduce((acc, r) => acc + Number(r.valorTotal), 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Consumo próprio
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Controle administrativo dos consumos registados pelos vendedores a custo.
          </p>
        </div>
        <Link
          href="/vendas"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          Voltar para vendas
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Vendedor" htmlFor="f-vendedor">
          <select
            id="f-vendedor"
            name="vendedorId"
            defaultValue={vendedorId ?? ""}
            className={nativeSelectClassName}
          >
            <option value="">Todos</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="De" htmlFor="f-from">
          <input
            id="f-from"
            name="from"
            type="date"
            defaultValue={sp.from ?? toInputDate(fromDefault)}
            className={nativeSelectClassName}
          />
        </Field>
        <Field label="Até" htmlFor="f-to">
          <input
            id="f-to"
            name="to"
            type="date"
            defaultValue={sp.to ?? toInputDate(toDefault)}
            className={nativeSelectClassName}
          />
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" className="rounded-xl font-semibold">
            Filtrar
          </Button>
          <Link
            href="/consumo-proprio"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "rounded-xl")}
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período filtrado
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {format(from, "d MMM yyyy", { locale: ptBR })} —{" "}
            {format(to, "d MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Unidades consumidas
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatInt(totalQtd)}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total a cobrar (custo)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(totalValor)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum consumo próprio encontrado com estes filtros.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {format(r.createdAt, "d MMM yyyy · HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/vendedores/${r.vendedor.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {r.vendedor.nome}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/produtos/${r.produto.id}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {r.produto.nome}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{r.produto.sku}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatInt(r.quantidade)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(r.valorUnitario))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatBRL(Number(r.valorTotal))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { listComodatoInstalado } from "@/lib/data/comodato-instalado";
import { listVendedoresParaFiltro } from "@/lib/data/catalog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Field, nativeSelectClassName } from "@/components/forms/form-field";

export default async function ComodatoEstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ vendedorId?: string }>;
}) {
  const sp = await searchParams;
  const vendedorFiltro =
    sp.vendedorId && sp.vendedorId !== "" ? sp.vendedorId : undefined;

  const [linhas, vendedores, totais] = await Promise.all([
    listComodatoInstalado(vendedorFiltro),
    listVendedoresParaFiltro(),
    prisma.sellerProductStock.aggregate({
      where: { quantidade: { gt: 0 } },
      _sum: { quantidade: true },
    }),
  ]);

  const totalUnidadesGeral = totais._sum.quantidade ?? 0;
  const totalUnidadesVisivel = linhas.reduce((a, r) => a + r.quantidade, 0);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Estoque em comodato
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Unidades atualmente em posse dos vendedores (entregas em comodato,
            vendas automáticas a partir do central, etc.)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/comodato/operacoes"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Ajustar ou devolver
          </Link>
          <Link
            href="/comodato"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Nova entrega
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total no sistema (todas as linhas &gt; 0)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
            {totalUnidadesGeral}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">unidades</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Nesta consulta
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
            {totalUnidadesVisivel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {linhas.length} linha(s) · {new Set(linhas.map((l) => l.sellerId)).size}{" "}
            vendedor(es)
          </p>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]"
      >
        <Field label="Filtrar por vendedor" htmlFor="f-vend-com" className="min-w-[200px] flex-1">
          <select
            id="f-vend-com"
            name="vendedorId"
            defaultValue={vendedorFiltro ?? ""}
            className={nativeSelectClassName}
          >
            <option value="">Todos os vendedores</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" size="sm" className="rounded-xl font-semibold">
          Aplicar
        </Button>
        <Link
          href="/comodato/estoque"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl font-semibold"
          )}
        >
          Limpar
        </Link>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="hidden md:table-cell text-right">
                Pço. sug.
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhuma unidade em comodato
                  {vendedorFiltro ? " para este vendedor" : ""}. Use{" "}
                  <Link href="/comodato" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Entrega em comodato
                  </Link>{" "}
                  para transferir do central.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/vendedores/${row.sellerId}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {row.seller.nome}
                    </Link>
                    {!row.seller.ativo ? (
                      <Badge variant="secondary" className="ml-2 font-semibold">
                        Inativo
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/produtos/${row.productId}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {row.product.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">
                    {row.product.sku}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {row.quantidade}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatBRL(Number(row.product.precoVendaSugerido))}
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

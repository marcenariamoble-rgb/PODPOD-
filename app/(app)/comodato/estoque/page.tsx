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

  const [linhas, vendedores, totais, centralProdutos, linhasGlobal] = await Promise.all([
    listComodatoInstalado(vendedorFiltro),
    listVendedoresParaFiltro(),
    prisma.sellerProductStock.aggregate({
      where: { quantidade: { gt: 0 } },
      _sum: { quantidade: true },
    }),
    prisma.product.findMany({
      where: { ativo: true, estoqueCentral: { gt: 0 } },
      select: { estoqueCentral: true, custoUnitario: true, precoVendaSugerido: true },
    }),
    prisma.sellerProductStock.findMany({
      where: { quantidade: { gt: 0 } },
      select: {
        quantidade: true,
        product: { select: { custoUnitario: true, precoVendaSugerido: true } },
      },
    }),
  ]);

  const totalUnidadesGeral = totais._sum.quantidade ?? 0;
  const totalUnidadesVisivel = linhas.reduce((a, r) => a + r.quantidade, 0);
  const valorComodatoCustoVisivel = linhas.reduce(
    (a, r) => a + r.quantidade * Number(r.product.custoUnitario),
    0
  );
  const valorComodatoVendaVisivel = linhas.reduce(
    (a, r) => a + r.quantidade * Number(r.product.precoVendaSugerido),
    0
  );
  const valorComodatoCustoGlobal = linhasGlobal.reduce(
    (a, r) => a + r.quantidade * Number(r.product.custoUnitario),
    0
  );
  const valorComodatoVendaGlobal = linhasGlobal.reduce(
    (a, r) => a + r.quantidade * Number(r.product.precoVendaSugerido),
    0
  );
  const valorCentralCusto = centralProdutos.reduce(
    (a, p) => a + p.estoqueCentral * Number(p.custoUnitario),
    0
  );
  const valorCentralVenda = centralProdutos.reduce(
    (a, p) => a + p.estoqueCentral * Number(p.precoVendaSugerido),
    0
  );

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
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dinheiro no estoque central
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
            Custo: {formatBRL(valorCentralCusto)}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            Venda: {formatBRL(valorCentralVenda)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dinheiro em comodato (consulta)
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
            Custo: {formatBRL(valorComodatoCustoVisivel)}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            Venda: {formatBRL(valorComodatoVendaVisivel)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dinheiro em comodato (total sistema)
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
            Custo: {formatBRL(valorComodatoCustoGlobal)}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            Venda: {formatBRL(valorComodatoVendaGlobal)}
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
              <TableHead className="hidden md:table-cell text-right">Custo unit.</TableHead>
              <TableHead className="hidden md:table-cell text-right">Pço. sug.</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Valor custo</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Valor venda</TableHead>
              <TableHead className="w-[96px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
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
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.product.marca}
                      {row.product.sabor ? ` · ${row.product.sabor}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">
                    {row.product.sku}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {row.quantidade}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatBRL(Number(row.product.custoUnitario))}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatBRL(Number(row.product.precoVendaSugerido))}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatBRL(row.quantidade * Number(row.product.custoUnitario))}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatBRL(row.quantidade * Number(row.product.precoVendaSugerido))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/produtos/${row.productId}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "rounded-lg font-semibold text-primary"
                      )}
                    >
                      Editar
                    </Link>
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

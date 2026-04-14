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

  const [linhas, vendedores, totais, centralProdutos, linhasGlobal, produtosRede] = await Promise.all([
    listComodatoInstalado(vendedorFiltro),
    listVendedoresParaFiltro(),
    prisma.sellerProductStock.aggregate({
      where: { quantidade: { gt: 0 } },
      _sum: { quantidade: true },
    }),
    prisma.product.findMany({
      where: { ativo: true, estoqueCentral: { gt: 0 } },
      select: {
        id: true,
        nome: true,
        marca: true,
        sabor: true,
        sku: true,
        estoqueCentral: true,
        custoUnitario: true,
        precoVendaSugerido: true,
      },
    }),
    prisma.sellerProductStock.findMany({
      where: { quantidade: { gt: 0 } },
      select: {
        quantidade: true,
        product: { select: { custoUnitario: true, precoVendaSugerido: true } },
      },
    }),
    prisma.product.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        marca: true,
        sabor: true,
        sku: true,
        estoqueCentral: true,
        custoUnitario: true,
        precoVendaSugerido: true,
        sellerStocks: {
          where: { quantidade: { gt: 0 } },
          select: { sellerId: true, quantidade: true },
        },
      },
      orderBy: { nome: "asc" },
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
  const resumoRedePorProduto = produtosRede
    .map((p) => {
      const emComodato = p.sellerStocks.reduce((acc, row) => acc + row.quantidade, 0);
      const totalRede = p.estoqueCentral + emComodato;
      const vendedoresComPosse = new Set(p.sellerStocks.map((s) => s.sellerId)).size;
      return {
        id: p.id,
        nome: p.nome,
        marca: p.marca,
        sabor: p.sabor,
        sku: p.sku,
        central: p.estoqueCentral,
        emComodato,
        totalRede,
        vendedoresComPosse,
        custoUnitario: Number(p.custoUnitario),
        precoVendaSugerido: Number(p.precoVendaSugerido),
      };
    })
    .sort((a, b) => {
      if (b.totalRede !== a.totalRede) return b.totalRede - a.totalRede;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  const totalCentralRede = resumoRedePorProduto.reduce((acc, p) => acc + p.central, 0);
  const totalComodatoRede = resumoRedePorProduto.reduce((acc, p) => acc + p.emComodato, 0);
  const totalUnidadesRede = totalCentralRede + totalComodatoRede;
  const totalValorCustoRede = resumoRedePorProduto.reduce(
    (acc, p) => acc + p.totalRede * p.custoUnitario,
    0
  );
  const totalValorVendaRede = resumoRedePorProduto.reduce(
    (acc, p) => acc + p.totalRede * p.precoVendaSugerido,
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
            Total da rede (central + comodato)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
            {totalUnidadesRede}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">unidades</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total no central (rede)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
            {totalCentralRede}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">unidades</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total em comodato (rede)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
            {totalComodatoRede}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">unidades</p>
        </div>
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
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dinheiro total da rede
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
            Custo: {formatBRL(totalValorCustoRede)}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            Venda: {formatBRL(totalValorVendaRede)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Controle total por produto (rede inteira)
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="text-right">Central</TableHead>
                <TableHead className="text-right">Comodato</TableHead>
                <TableHead className="text-right">Total rede</TableHead>
                <TableHead className="hidden md:table-cell text-right">Com quantos vendedores</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor custo</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor venda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoRedePorProduto.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Nenhum produto ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                resumoRedePorProduto.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/produtos/${p.id}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {p.nome}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.marca}
                        {p.sabor ? ` · ${p.sabor}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{p.sku}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.central}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.emComodato}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{p.totalRede}</TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {p.vendedoresComPosse}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {formatBRL(p.totalRede * p.custoUnitario)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {formatBRL(p.totalRede * p.precoVendaSugerido)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      <div className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Produtos no estoque central
          </h2>
          <Link
            href="/estoque/entrada"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Nova entrada
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="text-right">Central</TableHead>
                <TableHead className="hidden md:table-cell text-right">Custo unit.</TableHead>
                <TableHead className="hidden md:table-cell text-right">Pço. sug.</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor custo</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Valor venda</TableHead>
                <TableHead className="w-[96px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centralProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Não há produtos com saldo no estoque central.
                  </TableCell>
                </TableRow>
              ) : (
                [...centralProdutos]
                  .sort((a, b) => b.estoqueCentral - a.estoqueCentral)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/produtos/${p.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {p.nome}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.marca}
                          {p.sabor ? ` · ${p.sabor}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">
                        {p.sku}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {p.estoqueCentral}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatBRL(Number(p.custoUnitario))}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatBRL(Number(p.precoVendaSugerido))}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {formatBRL(p.estoqueCentral * Number(p.custoUnitario))}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {formatBRL(p.estoqueCentral * Number(p.precoVendaSugerido))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/produtos/${p.id}`}
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

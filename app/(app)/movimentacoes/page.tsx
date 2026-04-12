import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { endOfDay, startOfDay } from "date-fns";
import { TipoMovimentacao, Prisma } from "@prisma/client";
import {
  listProdutosParaFiltro,
  listVendedoresParaFiltro,
} from "@/lib/data/catalog";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { formatBRL } from "@/lib/utils/format";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  PackagePlus,
  Truck,
  Receipt,
} from "lucide-react";

const tipoLabels: Record<TipoMovimentacao, string> = {
  ENTRADA: "Entrada",
  SAIDA_MANUAL: "Saída manual",
  ENTREGA_COMODATO: "Entrega comodato",
  DEVOLUCAO: "Devolução",
  VENDA: "Venda",
  ESTORNO_VENDA: "Estorno de venda",
  PERDA: "Perda / avaria",
  AJUSTE: "Ajuste",
};

const tipoValues = Object.keys(tipoLabels) as TipoMovimentacao[];

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    produtoId?: string;
    vendedorId?: string;
    tipo?: string;
    de?: string;
    ate?: string;
  }>;
}) {
  const sp = await searchParams;
  const where: Prisma.MovimentacaoEstoqueWhereInput = {};

  if (sp.produtoId) where.produtoId = sp.produtoId;
  if (sp.vendedorId) where.vendedorId = sp.vendedorId;
  if (sp.tipo && tipoValues.includes(sp.tipo as TipoMovimentacao)) {
    where.tipoMovimentacao = sp.tipo as TipoMovimentacao;
  }

  if (sp.de || sp.ate) {
    where.createdAt = {};
    if (sp.de) {
      const d = new Date(sp.de);
      if (!Number.isNaN(d.getTime())) where.createdAt.gte = startOfDay(d);
    }
    if (sp.ate) {
      const d = new Date(sp.ate);
      if (!Number.isNaN(d.getTime())) where.createdAt.lte = endOfDay(d);
    }
  }

  const [rows, produtos, vendedores] = await Promise.all([
    prisma.movimentacaoEstoque.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        produto: true,
        vendedor: true,
        usuarioResponsavel: true,
      },
    }),
    listProdutosParaFiltro(),
    listVendedoresParaFiltro(),
  ]);

  const q = new URLSearchParams();
  if (sp.produtoId) q.set("produtoId", sp.produtoId);
  if (sp.vendedorId) q.set("vendedorId", sp.vendedorId);
  if (sp.tipo) q.set("tipo", sp.tipo);
  if (sp.de) q.set("de", sp.de);
  if (sp.ate) q.set("ate", sp.ate);
  const qStr = q.toString();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Movimentações
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Histórico de entradas e saídas (até 500 registros por consulta)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/estoque/entrada"
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <PackagePlus className="mr-1.5 size-4" />
            Nova entrada
          </Link>
          <Link
            href="/movimentacoes/saida"
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <ArrowDownToLine className="mr-1.5 size-4" />
            Saída manual
          </Link>
          <Link
            href="/comodato"
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <Truck className="mr-1.5 size-4" />
            Comodato
          </Link>
          <Link
            href="/vendas"
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <Receipt className="mr-1.5 size-4" />
            Vendas
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Produto" htmlFor="f-produto">
            <select
              id="f-produto"
              name="produtoId"
              defaultValue={sp.produtoId ?? ""}
              className={nativeSelectClassName}
            >
              <option value="">Todos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.sku})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vendedor" htmlFor="f-vend">
            <select
              id="f-vend"
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
          <Field label="Tipo" htmlFor="f-tipo">
            <select
              id="f-tipo"
              name="tipo"
              defaultValue={sp.tipo ?? ""}
              className={nativeSelectClassName}
            >
              <option value="">Todos</option>
              {tipoValues.map((t) => (
                <option key={t} value={t}>
                  {tipoLabels[t]}
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
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" className="rounded-xl font-semibold">
            Aplicar filtros
          </Button>
          <Link
            href="/movimentacoes"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden sm:table-cell">Vendedor</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
              <TableHead className="hidden lg:table-cell">Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <PodPodEmptyHint className="mx-2 my-3 border-0 bg-muted/10 py-8">
                    Nenhum registro com estes filtros. Ajuste o período ou use{" "}
                    <strong>Limpar</strong>.
                  </PodPodEmptyHint>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(m.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tipoLabels[m.tipoMovimentacao]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm font-medium">
                    <Link
                      href={`/produtos/${m.produtoId}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {m.produto.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {m.vendedor ? (
                      <Link
                        href={`/vendedores/${m.vendedorId}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {m.vendedor.nome}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.quantidade}</TableCell>
                  <TableCell className="hidden md:table-cell text-right text-sm tabular-nums">
                    {m.valorTotal != null
                      ? formatBRL(Number(m.valorTotal))
                      : m.valorUnitario != null
                        ? formatBRL(Number(m.valorUnitario))
                        : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {m.usuarioResponsavel.nome}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {qStr ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link
            href={`/movimentacoes?${qStr}`}
            className="inline-flex items-center gap-1 font-medium text-primary"
          >
            <ArrowLeftRight className="size-3.5" />
            Link desta consulta
          </Link>
        </p>
      ) : null}
    </div>
  );
}

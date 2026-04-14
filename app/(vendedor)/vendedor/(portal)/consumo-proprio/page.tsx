import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { actionConsumoProprioPortal } from "@/app/actions/vendedor-portal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorConsumoProprioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const session = await auth();
  const sellerId = session!.user.sellerId!;

  const [rows, historico] = await Promise.all([
    listProdutosEmPosse(sellerId),
    prisma.venda.findMany({
      where: { vendedorId: sellerId, formaPagamento: "CONSUMO_PROPRIO" },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { produto: { select: { id: true, nome: true, sku: true } } },
    }),
  ]);

  const totalConsumo = historico.reduce((acc, r) => acc + Number(r.valorTotal), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Consumo próprio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Baixa da sua posse com cobrança ao custo do produto.
          </p>
        </div>
        <Link
          href="/vendedor/estoque"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          Ver estoque
        </Link>
      </div>

      <FormSuccessBanner
        message={ok === "1" ? "Consumo próprio registrado com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Total cobrado em consumo próprio
        </p>
        <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
          {formatBRL(totalConsumo)}
        </p>
      </div>

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Sem unidades em posse para consumo próprio no momento.
        </PodPodEmptyHint>
      ) : (
        <form action={actionConsumoProprioPortal} className="space-y-4">
          <input type="hidden" name="redirectAfter" value="/vendedor/consumo-proprio" />
          <Field label="Produto" htmlFor="productId">
            <select id="productId" name="productId" required className={nativeSelectClassName}>
              <option value="">Selecione…</option>
              {rows.map((r) => (
                <option key={r.id} value={r.product.id}>
                  {r.product.nome}
                  {r.product.marca ? ` · ${r.product.marca}` : ""}
                  {r.product.sabor ? ` · ${r.product.sabor}` : ""}
                  {` — ${r.quantidade} u. (custo ${formatBRL(Number(r.product.custoUnitario))})`}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantidade" htmlFor="quantidade">
            <Input id="quantidade" name="quantidade" type="number" min={1} required />
          </Field>
          <Field label="Observação" htmlFor="observacoes">
            <Textarea id="observacoes" name="observacoes" rows={3} />
          </Field>
          <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
            Registrar consumo próprio
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Ainda não há consumo próprio registrado.
                </TableCell>
              </TableRow>
            ) : (
              historico.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {format(v.createdAt, "d MMM yyyy · HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{v.produto.nome}</p>
                    <p className="font-mono text-xs text-muted-foreground">{v.produto.sku}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{v.quantidade}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(v.valorUnitario))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatBRL(Number(v.valorTotal))}
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

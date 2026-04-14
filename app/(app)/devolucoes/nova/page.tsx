import Link from "next/link";
import { actionDevolucao } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { listProdutosAtivos, listVendedoresParaFiltro } from "@/lib/data/catalog";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstornarVendaButton } from "@/components/vendas/estornar-venda-button";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function NovaDevolucaoPage({
  searchParams,
}: {
  searchParams: Promise<{ vendedorId?: string; error?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const vendedorFiltro =
    sp.vendedorId && sp.vendedorId !== "" ? sp.vendedorId : undefined;
  const error = sp.error ? decodeURIComponent(sp.error) : null;

  const [vendedores, produtos, vendasFiltradas] = await Promise.all([
    listVendedoresParaFiltro(),
    listProdutosAtivos(),
    vendedorFiltro
      ? prisma.venda.findMany({
          where: { vendedorId: vendedorFiltro },
          orderBy: { createdAt: "desc" },
          take: 60,
          include: { produto: true },
        })
      : Promise.resolve([]),
  ]);

  const vendedorNome =
    vendedorFiltro && vendedores.find((v) => v.id === vendedorFiltro)?.nome;

  const redirectAfterEstorno = vendedorFiltro
    ? `/devolucoes/nova?vendedorId=${encodeURIComponent(vendedorFiltro)}`
    : "/devolucoes/nova";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Corrigir venda ou devolução
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
            Para <strong>anular uma venda errada</strong>, escolha o vendedor e use{" "}
            <strong>Anular venda</strong> na linha certa — o registro some e o estoque
            volta ao estado anterior. O formulário antigo (produto + quantidade) serve
            só quando a mercadoria volta ao depósito <em>sem</em> apagar o histórico da
            venda (casos raros).
          </p>
        </div>
        <Link
          href="/vendas"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Voltar
        </Link>
      </div>

      <FormSuccessBanner
        message={
          sp.ok === "estorno" ? "Venda anulada; o estoque foi atualizado." : null
        }
      />
      <FormErrorBanner message={error} />

      <Card className="border-primary/20 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            1 — Anular uma venda específica
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Selecione o vendedor e localize a linha na lista (mais recentes primeiro).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-muted/15 p-4"
          >
            <Field
              label="Vendedor"
              htmlFor="dv-vend"
              className="min-w-[220px] flex-1"
            >
              <select
                id="dv-vend"
                name="vendedorId"
                defaultValue={vendedorFiltro ?? ""}
                className={nativeSelectClassName}
              >
                <option value="">Escolha o vendedor…</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" className="rounded-xl font-semibold">
              Mostrar vendas
            </Button>
            <Link
              href="/devolucoes/nova"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "rounded-xl font-semibold"
              )}
            >
              Limpar
            </Link>
          </form>

          {!vendedorFiltro ? (
            <PodPodEmptyHint>
              Escolha um vendedor e clique em <strong>Mostrar vendas</strong> para ver
              as linhas e anular a que estiver errada.
            </PodPodEmptyHint>
          ) : vendasFiltradas.length === 0 ? (
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma venda registada para{" "}
              <span className="font-semibold text-foreground">{vendedorNome}</span>.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Valor
                    </TableHead>
                    <TableHead className="w-[1%] text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendasFiltradas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(v.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{v.produto.nome}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.quantidade}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {formatBRL(Number(v.valorTotal))}
                      </TableCell>
                      <TableCell className="text-right">
                        <EstornarVendaButton
                          vendaId={v.id}
                          summary={`${v.produto.nome} — ${v.quantidade} un. (${formatBRL(Number(v.valorTotal))})`}
                          redirectAfter={redirectAfterEstorno}
                          quantidadeAlocadaCentral={v.quantidadeAlocadaCentral}
                          actionLabel="Anular venda"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="opacity-95">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            2 — Só mercadoria volta ao depósito (sem apagar a venda)
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Use apenas quando o registo da venda deve continuar válido e só o stock se
            move (ex.: troca física, ajuste de posse). Para venda lançada por engano,
            prefira a secção <strong>1</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <form action={actionDevolucao} className="space-y-4">
            <Field label="Vendedor" htmlFor="vendedorId-fis">
              <select
                id="vendedorId-fis"
                name="vendedorId"
                required
                className={nativeSelectClassName}
                defaultValue={vendedorFiltro ?? ""}
              >
                <option value="">Selecione…</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Produto" htmlFor="productId">
              <select
                id="productId"
                name="productId"
                required
                className={nativeSelectClassName}
              >
                <option value="">Selecione…</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                    {p.marca ? ` · ${p.marca}` : ""}
                    {p.sabor ? ` · ${p.sabor}` : ""}
                    {` (${p.sku}) — central: ${p.estoqueCentral}`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantidade" htmlFor="quantidade">
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min={1}
                required
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={2} />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              className="h-11 w-full rounded-xl font-semibold"
            >
              Registrar devolução física
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

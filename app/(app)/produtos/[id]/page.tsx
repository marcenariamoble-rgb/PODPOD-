import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import {
  actionAjusteEstoque,
  actionEntradaManual,
} from "@/app/actions/operations";
import {
  actionToggleProductAtivo,
  actionUpdateProduct,
} from "@/app/actions/cadastros";
import { formatBRL } from "@/lib/utils/format";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { DeleteProductButton } from "@/components/produtos/delete-product-button";
import { EstornarVendaButton } from "@/components/vendas/estornar-venda-button";
import { listVendedoresAtivos } from "@/lib/data/catalog";
import { getEstoqueGeralHintProps } from "@/lib/data/estoque-geral";
import { EstoqueGeralHint } from "@/components/inventory/estoque-geral-hint";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ProdutoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const [product, movs, vendas, emPosse, vendedores, hintGeral] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.movimentacaoEstoque.findMany({
      where: { produtoId: id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { vendedor: true, usuarioResponsavel: true },
    }),
    prisma.venda.findMany({
      where: { produtoId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { vendedor: true },
    }),
    prisma.sellerProductStock.findMany({
      where: { productId: id, quantidade: { gt: 0 } },
      include: { seller: true },
    }),
    listVendedoresAtivos(),
    getEstoqueGeralHintProps(),
  ]);

  if (!product) notFound();

  const baixo = product.estoqueCentral <= product.estoqueMinimo;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/produtos"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-2 inline-flex rounded-lg font-semibold text-primary"
            )}
          >
            ← Produtos
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {product.nome}
          </h1>
          <p className="mt-1 font-mono text-sm font-medium text-muted-foreground">
            {product.sku}
          </p>
        </div>
        {product.ativo ? (
          <Badge variant="success" className="rounded-lg px-3 py-1 font-semibold">
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary" className="rounded-lg px-3 py-1 font-semibold">
            Inativo
          </Badge>
        )}
        <form action={actionToggleProductAtivo}>
          <input type="hidden" name="id" value={product.id} />
          <Button type="submit" variant="outline" size="sm" className="rounded-xl font-semibold">
            {product.ativo ? "Inativar produto" : "Reativar produto"}
          </Button>
        </form>
      </div>

      <FormSuccessBanner
        message={
          ok === "1"
            ? "Operação registrada com sucesso."
            : ok === "estorno"
              ? "Venda estornada; o estoque foi atualizado."
              : null
        }
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Editar produto</CardTitle>
            <span className="text-xs font-medium text-muted-foreground">
              Central:{" "}
              <span className="tabular-nums text-foreground">{product.estoqueCentral}</span>
              {baixo ? (
                <Badge variant="warning" className="ml-2 font-semibold">
                  Estoque baixo
                </Badge>
              ) : null}
            </span>
          </CardHeader>
          <CardContent>
            <form
              action={actionUpdateProduct}
              encType="multipart/form-data"
              className="space-y-3"
            >
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="fotoUrl" value={product.fotoUrl ?? ""} />
              <Field label="Nome" htmlFor="nome">
                <Input id="nome" name="nome" required defaultValue={product.nome} />
              </Field>
              <Field label="Marca" htmlFor="marca">
                <Input id="marca" name="marca" required defaultValue={product.marca} />
              </Field>
              <Field label="Sabor / variação" htmlFor="sabor">
                <Input id="sabor" name="sabor" required defaultValue={product.sabor} />
              </Field>
              <Field label="Categoria" htmlFor="categoria">
                <Input id="categoria" name="categoria" defaultValue={product.categoria} />
              </Field>
              <Field label="SKU" htmlFor="sku">
                <Input id="sku" name="sku" required defaultValue={product.sku} />
              </Field>
              {product.fotoUrl ? (
                <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted/30">
                  {product.fotoUrl.startsWith("/") ? (
                    <Image
                      src={product.fotoUrl}
                      alt="Foto atual"
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- URL externa (ex.: Blob)
                    <img
                      src={product.fotoUrl}
                      alt="Foto atual"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              ) : null}
              <Field label="Nova foto (cardápio público)" htmlFor="foto">
                <Input
                  id="foto"
                  name="foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </Field>
              <p className="-mt-1 text-xs font-medium text-muted-foreground">
                Deixe em branco para manter a foto atual. JPG, PNG, WebP ou GIF — até 5 MB.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Custo unit. (R$)" htmlFor="custoUnitario">
                  <Input
                    id="custoUnitario"
                    name="custoUnitario"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={String(product.custoUnitario)}
                  />
                </Field>
                <Field label="Preço sugerido (R$)" htmlFor="precoVendaSugerido">
                  <Input
                    id="precoVendaSugerido"
                    name="precoVendaSugerido"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={String(product.precoVendaSugerido)}
                  />
                </Field>
              </div>
              <Field label="Estoque mínimo" htmlFor="estoqueMinimo">
                <Input
                  id="estoqueMinimo"
                  name="estoqueMinimo"
                  type="number"
                  min={0}
                  required
                  defaultValue={product.estoqueMinimo}
                />
              </Field>
              <Field label="Situação" htmlFor="ativo-edit">
                <select
                  id="ativo-edit"
                  name="ativo"
                  className={nativeSelectClassName}
                  defaultValue={product.ativo ? "true" : "false"}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </Field>
              <Button type="submit" size="sm" className="rounded-xl font-semibold">
                Salvar alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <EstoqueGeralHint
            estado={hintGeral.estado}
            nomeDetentor={hintGeral.nomeDetentor}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entrada manual</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={actionEntradaManual} className="space-y-3">
                <input type="hidden" name="productId" value={product.id} />
                <input
                  type="hidden"
                  name="redirectAfter"
                  value={`/produtos/${product.id}`}
                />
                <Field label="Quantidade" htmlFor="qtd-in">
                  <Input id="qtd-in" name="quantidade" type="number" min={1} required />
                </Field>
                <Field label="Custo unitário (opcional)" htmlFor="custo-in">
                  <Input
                    id="custo-in"
                    name="custoUnitario"
                    type="text"
                    inputMode="decimal"
                    placeholder="Registra na movimentação"
                  />
                </Field>
                <Field label="Observação" htmlFor="obs-in">
                  <Textarea id="obs-in" name="observacoes" rows={2} />
                </Field>
                <Button type="submit" size="sm" className="rounded-xl font-semibold">
                  Registrar entrada
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ajuste manual</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={actionAjusteEstoque} className="space-y-3">
                <input type="hidden" name="productId" value={product.id} />
                <Field label="Escopo" htmlFor="vendedorId-adj">
                  <select
                    id="vendedorId-adj"
                    name="vendedorId"
                    className={nativeSelectClassName}
                  >
                    <option value="">Estoque central</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.id}>
                        Vendedor: {v.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Variação (+ ou − unidades)"
                  htmlFor="quantidadeDelta"
                >
                  <Input
                    id="quantidadeDelta"
                    name="quantidadeDelta"
                    type="number"
                    required
                    placeholder="ex: -2 ou 5"
                  />
                </Field>
                <Field label="Justificativa" htmlFor="justificativa">
                  <Textarea id="justificativa" name="justificativa" rows={2} required />
                </Field>
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  className="rounded-xl font-semibold"
                >
                  Aplicar ajuste
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Com vendedores (em posse)</CardTitle>
        </CardHeader>
        <CardContent>
          {emPosse.length === 0 ? (
            <div className="flex items-center gap-3 py-1">
              <PodPodMark variant="empty" decorative className="h-10 w-10 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Nenhuma unidade em comodato com vendedores.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emPosse.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.seller.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.quantidade}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas movimentações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                <TableHead className="hidden lg:table-cell">Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(m.createdAt, "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.tipoMovimentacao}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {m.quantidade}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {m.vendedor?.nome ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {m.usuarioResponsavel.nome}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vendas recentes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Bruto</TableHead>
                <TableHead className="text-right">Repasse</TableHead>
                <TableHead>Financ.</TableHead>
                <TableHead className="w-[1%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(v.createdAt, "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{v.vendedor.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.quantidade}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatBRL(Number(v.valorTotal))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatBRL(Number(v.valorSaldoRepasse))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        v.statusFinanceiro === "PAGO"
                          ? "success"
                          : v.statusFinanceiro === "PARCIAL"
                            ? "warning"
                            : "secondary"
                      }
                      className="font-semibold"
                    >
                      {v.statusFinanceiro}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <EstornarVendaButton
                      vendaId={v.id}
                      summary={`${v.vendedor.nome} — ${v.quantidade} un. (${formatBRL(Number(v.valorTotal))})`}
                      redirectAfter={`/produtos/${id}`}
                      quantidadeAlocadaCentral={v.quantidadeAlocadaCentral}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-destructive/25 bg-destructive/[0.03]">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Excluir cadastro</CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Remove o produto da lista e apaga o histórico de vendas e movimentações
            deste item. Use para corrigir cadastros duplicados ou errados.
          </p>
        </CardHeader>
        <CardContent>
          <DeleteProductButton productId={product.id} productName={product.nome} />
        </CardContent>
      </Card>
    </div>
  );
}

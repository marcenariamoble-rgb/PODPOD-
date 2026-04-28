import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import {
  actionToggleSellerAtivo,
  actionUpdateSeller,
} from "@/app/actions/cadastros";
import { DeleteSellerButton } from "@/components/vendedores/delete-seller-button";
import { EstornarVendaButton } from "@/components/vendas/estornar-venda-button";
import { EditarVendaValorButton } from "@/components/vendas/editar-venda-valor-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";
import { formatBRL } from "@/lib/utils/format";
import { format } from "date-fns";
import { endOfDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function VendedorDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string; de?: string; ate?: string }>;
}) {
  const { id } = await params;
  const { error, ok, de, ate } = await searchParams;
  const seller = await prisma.seller.findUnique({ where: { id } });
  if (!seller) notFound();
  const from = de ? new Date(de) : null;
  const to = ate ? new Date(ate) : null;
  const periodFrom = from && !Number.isNaN(from.getTime()) ? startOfDay(from) : null;
  const periodTo = to && !Number.isNaN(to.getTime()) ? endOfDay(to) : null;
  const wherePeriodo =
    periodFrom || periodTo
      ? {
          createdAt: {
            ...(periodFrom ? { gte: periodFrom } : {}),
            ...(periodTo ? { lte: periodTo } : {}),
          },
        }
      : {};

  const [stocks, vendas, movs, fin, vendasAcertoPeriodo, recebidoPeriodo] = await Promise.all([
    prisma.sellerProductStock.findMany({
      where: { sellerId: id, quantidade: { gt: 0 } },
      include: { product: true },
      orderBy: { product: { nome: "asc" } },
    }),
    prisma.venda.findMany({
      where: { vendedorId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { produto: true },
    }),
    prisma.movimentacaoEstoque.findMany({
      where: { vendedorId: id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { produto: true, usuarioResponsavel: true },
    }),
    getSellerFinancialTotals(id),
    prisma.venda.findMany({
      where: { vendedorId: id, ...wherePeriodo },
      select: {
        quantidade: true,
        valorTotal: true,
        produto: { select: { custoUnitario: true } },
      },
    }),
    prisma.recebimento.aggregate({
      where: {
        vendedorId: id,
        ...(wherePeriodo as object),
      },
      _sum: { valorRecebido: true },
    }),
  ]);

  const pendente = fin.saldoPendente > 0;
  const percentualSocio = Number(seller.acertoSocietarioPercentual ?? 50);
  const qtdVendidaPeriodo = vendasAcertoPeriodo.reduce((acc, v) => acc + v.quantidade, 0);
  const brutoPeriodo = vendasAcertoPeriodo.reduce(
    (acc, v) => acc + Number(v.valorTotal),
    0
  );
  const custoPeriodo = vendasAcertoPeriodo.reduce(
    (acc, v) => acc + Number(v.produto.custoUnitario) * v.quantidade,
    0
  );
  const lucroPeriodo = Math.max(0, brutoPeriodo - custoPeriodo);
  const parcelaSocio = (lucroPeriodo * percentualSocio) / 100;
  const parcelaEmpresa = lucroPeriodo - parcelaSocio;
  const totalRecebidoPeriodo = Number(recebidoPeriodo._sum.valorRecebido ?? 0);
  const acertoAPagarSocio = parcelaSocio;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/vendedores"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-2 inline-flex rounded-lg font-semibold text-primary"
            )}
          >
            ← Vendedores
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {seller.nome}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {[seller.cidade, seller.regiao].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {seller.ativo ? (
            <Badge variant="success" className="rounded-lg font-semibold">
              Ativo
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-lg font-semibold">
              Inativo
            </Badge>
          )}
          <Link
            href="/vendas/nova"
            className={cn(buttonVariants({ size: "default" }), "rounded-xl font-semibold")}
          >
            Nova venda
          </Link>
          <form action={actionToggleSellerAtivo}>
            <input type="hidden" name="id" value={seller.id} />
            <Button type="submit" variant="outline" className="rounded-xl font-semibold">
              {seller.ativo ? "Inativar" : "Reativar"}
            </Button>
          </form>
        </div>
      </div>

      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />
      <FormSuccessBanner
        message={
          ok === "estorno"
            ? "Venda estornada; o estoque foi atualizado."
            : ok === "venda_editada"
              ? "Valor da venda atualizado com sucesso."
              : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionUpdateSeller} className="space-y-4">
            <input type="hidden" name="id" value={seller.id} />
            <Field label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required defaultValue={seller.nome} />
            </Field>
            <Field label="Telefone" htmlFor="telefone">
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                defaultValue={seller.telefone ?? ""}
              />
            </Field>
            <Field label="Código de venda (cardápio)" htmlFor="codigoVenda">
              <Input
                id="codigoVenda"
                name="codigoVenda"
                autoComplete="off"
                defaultValue={seller.codigoVenda ?? ""}
                placeholder="Ex.: 1024"
                className="font-mono"
              />
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Único na equipa. Com{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  /cardapio?codigo=…
                </code>{" "}
                só este vendedor recebe o aviso. Vazio = não usa indicação direta.
              </p>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cidade" htmlFor="cidade">
                <Input id="cidade" name="cidade" defaultValue={seller.cidade ?? ""} />
              </Field>
              <Field label="Região" htmlFor="regiao">
                <Input id="regiao" name="regiao" defaultValue={seller.regiao ?? ""} />
              </Field>
            </div>
            <Field label="Limite de comodato (unidades)" htmlFor="limiteComodato">
              <Input
                id="limiteComodato"
                name="limiteComodato"
                type="number"
                min={0}
                placeholder="Vazio = sem limite"
                defaultValue={seller.limiteComodato ?? ""}
              />
            </Field>
            <Field label="Observações" htmlFor="observacoes">
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                defaultValue={seller.observacoes ?? ""}
              />
            </Field>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">
                Repasse financeiro (comissão na venda)
              </p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Quando ativo, o pendente e os recebimentos são comparados ao valor líquido a
                repassar (venda menos comissão), não ao valor cheio ao cliente.
              </p>
              <Field label="Modalidade" htmlFor="comissaoDescontaNaVenda">
                <select
                  id="comissaoDescontaNaVenda"
                  name="comissaoDescontaNaVenda"
                  className={nativeSelectClassName}
                  defaultValue={seller.comissaoDescontaNaVenda ? "true" : "false"}
                >
                  <option value="false">Repassa o valor integral da venda (padrão)</option>
                  <option value="true">Já retém comissão — repassa só o saldo (líquido)</option>
                </select>
              </Field>
              <Field label="Como calcular a comissão" htmlFor="comissaoTipo">
                <select
                  id="comissaoTipo"
                  name="comissaoTipo"
                  className={nativeSelectClassName}
                  defaultValue={seller.comissaoTipo}
                >
                  <option value="NENHUMA">—</option>
                  <option value="PERCENTUAL_SOBRE_VENDA">
                    Percentual sobre o valor da venda
                  </option>
                  <option value="FIXA_POR_UNIDADE">Valor fixo por unidade vendida (R$)</option>
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Percentual (%)" htmlFor="comissaoPercentual">
                  <Input
                    id="comissaoPercentual"
                    name="comissaoPercentual"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 15"
                    defaultValue={
                      seller.comissaoPercentual != null
                        ? String(seller.comissaoPercentual)
                        : ""
                    }
                  />
                </Field>
                <Field label="R$ por unidade" htmlFor="comissaoPorUnidade">
                  <Input
                    id="comissaoPorUnidade"
                    name="comissaoPorUnidade"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 5,00"
                    defaultValue={
                      seller.comissaoPorUnidade != null
                        ? String(seller.comissaoPorUnidade)
                        : ""
                    }
                  />
                </Field>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Acerto societário</p>
              <Field label="Ativar painel de acerto" htmlFor="acertoSocietarioAtivo">
                <select
                  id="acertoSocietarioAtivo"
                  name="acertoSocietarioAtivo"
                  className={nativeSelectClassName}
                  defaultValue={seller.acertoSocietarioAtivo ? "true" : "false"}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </Field>
              <Field label="Percentual do sócio (%)" htmlFor="acertoSocietarioPercentual">
                <Input
                  id="acertoSocietarioPercentual"
                  name="acertoSocietarioPercentual"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 50"
                  defaultValue={String(seller.acertoSocietarioPercentual ?? "50")}
                />
              </Field>
            </div>
            <Field label="Situação" htmlFor="ativo">
              <select
                id="ativo"
                name="ativo"
                className={nativeSelectClassName}
                defaultValue={seller.ativo ? "true" : "false"}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </Field>
            <Field
              label="Consumo próprio no portal"
              htmlFor="consumoProprioHabilitado"
            >
              <select
                id="consumoProprioHabilitado"
                name="consumoProprioHabilitado"
                className={nativeSelectClassName}
                defaultValue={seller.consumoProprioHabilitado ? "true" : "false"}
              >
                <option value="true">Permitido</option>
                <option value="false">Bloqueado</option>
              </select>
            </Field>
            <Button type="submit" className="rounded-xl font-semibold">
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total vendido (cliente)
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatBRL(fin.totalVendas)}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comissão já retida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {formatBRL(fin.totalComissaoRetida)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Fica com o vendedor no ato da venda
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-primary">
              A repassar (empresa)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {formatBRL(fin.totalSaldoRepasse)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              Base do saldo a receber
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/25 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-success">
              Recebido
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatBRL(fin.totalRecebido)}
          </CardContent>
        </Card>
        <Card
          className={cn(
            "border-border/70",
            pendente &&
              "border-warning/45 bg-gradient-to-br from-warning/10 via-card to-card ring-1 ring-warning/15"
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Saldo pendente
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {formatBRL(fin.saldoPendente)}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Unidades em posse
            </CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-2xl font-bold tabular-nums text-foreground">
            {stocks.reduce((a, s) => a + s.quantidade, 0)}
          </CardContent>
        </Card>
      </div>

      {seller.acertoSocietarioAtivo ? (
        <Card className="border-primary/25 bg-primary/[0.04]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Acerto societário ({percentualSocio}% sócio)</CardTitle>
            <form className="grid gap-3 sm:grid-cols-3" method="get">
              <Field label="De" htmlFor="acerto-de">
                <Input id="acerto-de" name="de" type="date" defaultValue={de ?? ""} />
              </Field>
              <Field label="Até" htmlFor="acerto-ate">
                <Input id="acerto-ate" name="ate" type="date" defaultValue={ate ?? ""} />
              </Field>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm" className="rounded-lg font-semibold">
                  Aplicar
                </Button>
                <Link
                  href={`/vendedores/${id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg")}
                >
                  Limpar
                </Link>
              </div>
            </form>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Qtd vendida (período)</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{qtdVendidaPeriodo}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Bruto vendido</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(brutoPeriodo)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Custo estimado</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(custoPeriodo)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Lucro do período</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(lucroPeriodo)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Recebido dele</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">
                  {formatBRL(totalRecebidoPeriodo)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Parcela sócio (sobre lucro)</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(parcelaSocio)}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground">Parcela empresa (sobre lucro)</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(parcelaEmpresa)}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-3">
                <p className="text-xs font-medium text-muted-foreground">Acerto a pagar ao sócio</p>
                <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{formatBRL(acertoAPagarSocio)}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Cálculo societário: (bruto - custo) = lucro; percentual do sócio aplicado sobre o lucro.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estoque em posse</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {stocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem unidades em posse.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        className="underline-offset-4 hover:underline"
                        href={`/produtos/${s.product.id}`}
                      >
                        {s.product.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.quantidade}
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
          <CardTitle className="text-base">Vendas recentes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Bruto</TableHead>
                <TableHead className="text-right">Repasse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(v.createdAt, "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{v.produto.nome}</TableCell>
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
                    <div className="inline-flex gap-2">
                      <EditarVendaValorButton
                        vendaId={v.id}
                        produtoNome={v.produto.nome}
                        valorUnitarioAtual={Number(v.valorUnitario)}
                        redirectAfter={`/vendedores/${id}`}
                      />
                      <EstornarVendaButton
                        vendaId={v.id}
                        summary={`${v.produto.nome} — ${v.quantidade} un. (${formatBRL(Number(v.valorTotal))})`}
                        redirectAfter={`/vendedores/${id}`}
                        quantidadeAlocadaCentral={v.quantidadeAlocadaCentral}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico (movimentações)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="hidden md:table-cell">Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {format(m.createdAt, "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.tipoMovimentacao}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.produto.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.quantidade}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {m.usuarioResponsavel.nome}
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
            Remove o vendedor da lista e apaga vendas, recebimentos, movimentações e
            estoque em posse. O utilizador da app associado (se existir) deixa de
            aceder como vendedor.
          </p>
        </CardHeader>
        <CardContent>
          <DeleteSellerButton sellerId={seller.id} sellerName={seller.nome} />
        </CardContent>
      </Card>
    </div>
  );
}

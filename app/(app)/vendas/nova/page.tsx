import Link from "next/link";
import { actionVenda } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { listProdutosAtivos } from "@/lib/data/catalog";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { VendaLoteItensFields } from "@/components/sales/venda-lote-itens-fields";
import { prisma } from "@/lib/db";
import { formatInt } from "@/lib/utils/format";

export default async function NovaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const [produtos, vendedoresRaw] = await Promise.all([
    listProdutosAtivos(),
    prisma.seller.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        sellerStocks: {
          where: { quantidade: { gt: 0 } },
          select: { quantidade: true, productId: true },
        },
      },
    }),
  ]);
  const vendedores = vendedoresRaw.map((v) => ({
    id: v.id,
    nome: v.nome,
    totalComodato: v.sellerStocks.reduce((acc, s) => acc + s.quantidade, 0),
  }));
  const estoqueComodatoPorVendedorProduto = Object.fromEntries(
    vendedoresRaw.map((v) => [
      v.id,
      Object.fromEntries(v.sellerStocks.map((s) => [s.productId, s.quantidade])),
    ])
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Nova venda
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Baixa o estoque do vendedor e regista o valor pago pelo cliente. Se o
            vendedor já retém comissão no ato da venda, o cadastro dele define a
            regra; o sistema grava o valor líquido a repassar para a empresa. Se
            faltar unidade em posse, o central é usado automaticamente (comodato).
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
        message={ok === "1" ? "Venda em lote registrada com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Registrar venda em lote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionVenda} className="space-y-4">
            <input type="hidden" name="redirectAfter" value="/vendas/nova" />
            <Field label="Vendedor" htmlFor="vendedorId">
              <select
                id="vendedorId"
                name="vendedorId"
                required
                className={nativeSelectClassName}
              >
                <option value="">Selecione…</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome} — em comodato: {formatInt(v.totalComodato)} u.
                  </option>
                ))}
              </select>
            </Field>
            <VendaLoteItensFields
              options={produtos.map((p) => ({
                value: p.id,
                label:
                  `${p.nome}` +
                  `${p.marca ? ` · ${p.marca}` : ""}` +
                  `${p.sabor ? ` · ${p.sabor}` : ""}` +
                  ` (${p.sku})`,
              }))}
              initialRows={4}
              sellerSelectId="vendedorId"
              estoqueComodatoPorVendedorProduto={estoqueComodatoPorVendedorProduto}
            />
            <Field label="Forma de pagamento" htmlFor="formaPagamento">
              <Input
                id="formaPagamento"
                name="formaPagamento"
                placeholder="Pix, dinheiro…"
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Salvar venda em lote
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

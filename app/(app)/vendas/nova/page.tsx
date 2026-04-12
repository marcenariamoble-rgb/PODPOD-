import Link from "next/link";
import { actionVenda } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { listProdutosAtivos, listVendedoresAtivos } from "@/lib/data/catalog";

export default async function NovaVendaPage() {
  const [produtos, vendedores] = await Promise.all([
    listProdutosAtivos(),
    listVendedoresAtivos(),
  ]);

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Registrar venda do vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionVenda} className="space-y-4">
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
                    {p.nome} ({p.sku})
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
            <Field label="Valor unitário (R$)" htmlFor="valorUnitario">
              <Input
                id="valorUnitario"
                name="valorUnitario"
                type="number"
                step="0.01"
                min={0}
                required
              />
            </Field>
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
              Salvar venda
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { actionVenda } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { listProdutosAtivos, listVendedoresAtivos } from "@/lib/data/catalog";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";

const LINHAS_LOTE = 8;

export default async function NovaVendaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
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
                    {v.nome}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preencha vários itens (linhas vazias são ignoradas).
              </p>
              <div className="space-y-2">
                {Array.from({ length: LINHAS_LOTE }).map((_, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_110px_150px]">
                    <select name="productId" className={nativeSelectClassName}>
                      <option value="">Produto #{idx + 1}</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.sku})
                        </option>
                      ))}
                    </select>
                    <Input name="quantidade" type="number" min={0} placeholder="Qtd" />
                    <Input
                      name="valorUnitario"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Valor unit."
                    />
                  </div>
                ))}
              </div>
            </div>
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

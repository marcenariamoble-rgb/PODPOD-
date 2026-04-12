import Link from "next/link";
import { actionEntradaManual } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { listProdutosAtivos } from "@/lib/data/catalog";
import { getEstoqueGeralHintProps } from "@/lib/data/estoque-geral";
import { EstoqueGeralHint } from "@/components/inventory/estoque-geral-hint";
import { cn } from "@/lib/utils";

export default async function EntradaEstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const [produtos, hint] = await Promise.all([
    listProdutosAtivos(),
    getEstoqueGeralHintProps(),
  ]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Entrada no estoque central
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Aumenta o saldo central; a movimentação fica associada ao detentor do
            estoque geral (quando configurado).
          </p>
        </div>
        <Link
          href="/produtos"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Produtos
        </Link>
      </div>

      <FormSuccessBanner
        message={ok === "1" ? "Entrada registrada com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <EstoqueGeralHint estado={hint.estado} nomeDetentor={hint.nomeDetentor} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Nova entrada</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionEntradaManual} className="space-y-4">
            <input type="hidden" name="redirectAfter" value="/estoque/entrada" />
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
                    {p.nome} ({p.sku}) — central: {p.estoqueCentral}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantidade" htmlFor="quantidade">
              <Input id="quantidade" name="quantidade" type="number" min={1} required />
            </Field>
            <Field label="Custo unitário (opcional)" htmlFor="custoUnitario">
              <Input
                id="custoUnitario"
                name="custoUnitario"
                type="text"
                inputMode="decimal"
                placeholder="Registrado na movimentação"
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Registrar entrada
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

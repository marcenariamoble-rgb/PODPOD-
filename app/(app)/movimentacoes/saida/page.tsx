import Link from "next/link";
import { actionSaidaManual } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { listProdutosAtivos } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export default async function SaidaManualPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const produtos = await listProdutosAtivos();

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Saída manual
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Retira unidades do estoque central (amostras, consumo interno, etc.)
          </p>
        </div>
        <Link
          href="/movimentacoes"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Movimentações
        </Link>
      </div>

      <FormSuccessBanner
        message={ok === "1" ? "Saída registrada com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Registrar saída</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionSaidaManual} className="space-y-4">
            <input type="hidden" name="redirectAfter" value="/movimentacoes/saida" />
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
            <Field label="Valor unitário de referência (opcional)" htmlFor="valorUnitario">
              <Input
                id="valorUnitario"
                name="valorUnitario"
                type="text"
                inputMode="decimal"
                placeholder="Para registro de custo estimado"
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Registrar saída
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

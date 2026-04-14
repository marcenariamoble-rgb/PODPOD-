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

const LINHAS_LOTE = 10;

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
          <CardTitle className="text-lg font-semibold">Nova entrada em lote</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionEntradaManual} className="space-y-4">
            <input type="hidden" name="redirectAfter" value="/estoque/entrada" />
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Preencha até {LINHAS_LOTE} itens por envio. Linhas vazias são ignoradas.
              </p>
              <div className="space-y-2">
                {Array.from({ length: LINHAS_LOTE }).map((_, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_110px_160px]">
                    <select name="productId" className={nativeSelectClassName}>
                      <option value="">Produto #{idx + 1}</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                          {p.marca ? ` · ${p.marca}` : ""}
                          {p.sabor ? ` · ${p.sabor}` : ""}
                          {` (${p.sku}) — central: ${p.estoqueCentral}`}
                        </option>
                      ))}
                    </select>
                    <Input name="quantidade" type="number" min={0} placeholder="Qtd" />
                    <Input
                      name="custoUnitario"
                      type="text"
                      inputMode="decimal"
                      placeholder="Custo unit. (opc.)"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Registrar entradas em lote
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

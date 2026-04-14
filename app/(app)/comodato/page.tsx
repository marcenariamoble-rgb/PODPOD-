import Link from "next/link";
import { actionComodato } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import {
  listProdutosAtivos,
  listVendedoresAtivosParaComodato,
} from "@/lib/data/catalog";

export default async function ComodatoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const [produtos, vendedores] = await Promise.all([
    listProdutosAtivos(),
    listVendedoresAtivosParaComodato(),
  ]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Entrega em comodato
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Transfere unidades do central para um vendedor de rota (não use para o
            detentor do estoque geral — repor o depósito em &quot;Entrada no
            estoque&quot;).
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Link
            href="/comodato/estoque"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-lg font-semibold"
            )}
          >
            Ver estoque em comodato
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-lg font-semibold text-primary"
            )}
          >
            Voltar
          </Link>
        </div>
      </div>
      <FormSuccessBanner
        message={ok === "1" ? "Entrega em comodato registrada com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Nova entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionComodato} className="space-y-4">
            <input type="hidden" name="redirectAfter" value="/comodato" />
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
            <Field
              label="Valor unitário de referência (opcional)"
              htmlFor="valorUnitario"
            >
              <Input
                id="valorUnitario"
                name="valorUnitario"
                type="number"
                step="0.01"
                min={0}
                placeholder="Usa preço sugerido se vazio"
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Registrar entrega
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

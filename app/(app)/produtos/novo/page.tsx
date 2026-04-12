import Link from "next/link";
import { actionCreateProduct } from "@/app/actions/cadastros";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { cn } from "@/lib/utils";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Novo produto
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Cadastre no catálogo e no estoque central (saldo inicia em zero)
          </p>
        </div>
        <Link
          href="/produtos"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Voltar
        </Link>
      </div>

      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados do produto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionCreateProduct} className="space-y-4">
            <Field label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required placeholder="Ex.: Pod Mint Ice" />
            </Field>
            <Field label="Marca" htmlFor="marca">
              <Input id="marca" name="marca" required />
            </Field>
            <Field label="Sabor / variação" htmlFor="sabor">
              <Input id="sabor" name="sabor" required />
            </Field>
            <Field label="Categoria" htmlFor="categoria">
              <Input
                id="categoria"
                name="categoria"
                placeholder="Opcional — padrão: Geral"
              />
            </Field>
            <Field label="SKU" htmlFor="sku">
              <Input
                id="sku"
                name="sku"
                placeholder="Deixe vazio para gerar automaticamente"
              />
            </Field>
            <Field
              label="URL da foto (cardápio público)"
              htmlFor="fotoUrl"
            >
              <Input
                id="fotoUrl"
                name="fotoUrl"
                type="url"
                inputMode="url"
                placeholder="https://… ou /caminho/em/public"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Custo unitário (R$)" htmlFor="custoUnitario">
                <Input
                  id="custoUnitario"
                  name="custoUnitario"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                />
              </Field>
              <Field label="Preço de venda sugerido (R$)" htmlFor="precoVendaSugerido">
                <Input
                  id="precoVendaSugerido"
                  name="precoVendaSugerido"
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0,00"
                />
              </Field>
            </div>
            <Field label="Estoque mínimo (alerta)" htmlFor="estoqueMinimo">
              <Input
                id="estoqueMinimo"
                name="estoqueMinimo"
                type="number"
                min={0}
                defaultValue={0}
                required
              />
            </Field>
            <Field label="Situação" htmlFor="ativo">
              <select id="ativo" name="ativo" className={nativeSelectClassName}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Salvar produto
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

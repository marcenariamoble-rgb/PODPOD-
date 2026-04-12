import Link from "next/link";
import { actionCreateSeller } from "@/app/actions/cadastros";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { cn } from "@/lib/utils";

export default async function NovoVendedorPage({
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
            Novo vendedor
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Cadastro de parceiro para comodato e vendas
          </p>
        </div>
        <Link
          href="/vendedores"
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
          <CardTitle className="text-lg font-semibold">Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionCreateSeller} className="space-y-4">
            <Field label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required placeholder="Nome completo ou fantasia" />
            </Field>
            <Field label="Telefone" htmlFor="telefone">
              <Input id="telefone" name="telefone" type="tel" placeholder="Opcional" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cidade" htmlFor="cidade">
                <Input id="cidade" name="cidade" />
              </Field>
              <Field label="Região" htmlFor="regiao">
                <Input id="regiao" name="regiao" placeholder="Zona, bairro…" />
              </Field>
            </div>
            <Field label="Limite de comodato (unidades)" htmlFor="limiteComodato">
              <Input
                id="limiteComodato"
                name="limiteComodato"
                type="number"
                min={0}
                placeholder="Vazio = sem limite"
              />
            </Field>
            <Field label="Observações" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">
                Repasse financeiro (comissão na venda)
              </p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Use quando o vendedor já desconta a comissão combinada no ato da venda e só
                lhe repassa o saldo. O sistema passa a controlar o pendente sobre o valor
                líquido para a empresa, não sobre o valor cheio ao cliente.
              </p>
              <Field label="Modalidade" htmlFor="comissaoDescontaNaVenda">
                <select
                  id="comissaoDescontaNaVenda"
                  name="comissaoDescontaNaVenda"
                  className={nativeSelectClassName}
                  defaultValue="false"
                >
                  <option value="false">
                    Repassa o valor integral da venda (padrão)
                  </option>
                  <option value="true">
                    Já retém comissão — repassa só o saldo (líquido)
                  </option>
                </select>
              </Field>
              <Field label="Como calcular a comissão" htmlFor="comissaoTipo">
                <select
                  id="comissaoTipo"
                  name="comissaoTipo"
                  className={nativeSelectClassName}
                  defaultValue="NENHUMA"
                >
                  <option value="NENHUMA">—</option>
                  <option value="PERCENTUAL_SOBRE_VENDA">Percentual sobre o valor da venda</option>
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
                  />
                </Field>
                <Field label="R$ por unidade" htmlFor="comissaoPorUnidade">
                  <Input
                    id="comissaoPorUnidade"
                    name="comissaoPorUnidade"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex.: 5,00"
                  />
                </Field>
              </div>
            </div>
            <Field label="Situação" htmlFor="ativo">
              <select id="ativo" name="ativo" className={nativeSelectClassName}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Salvar vendedor
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

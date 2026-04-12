import Link from "next/link";
import { actionAjusteEstoque, actionDevolucao } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import {
  listProdutosAtivos,
  listVendedoresParaFiltro,
} from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

export default async function ComodatoOperacoesPage() {
  const [vendedores, produtos] = await Promise.all([
    listVendedoresParaFiltro(),
    listProdutosAtivos(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Ajustes e devoluções em comodato
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
            Corrija a posse do vendedor (inventário, perdas não vendidas, erros de
            lançamento) ou registe a devolução física de mercadoria ao depósito
            central — tudo fica nas movimentações com tipo adequado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/comodato/estoque"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-xl font-semibold"
            )}
          >
            Ver estoque em comodato
          </Link>
          <Link
            href="/devolucoes/nova"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0 rounded-lg font-semibold text-primary"
            )}
          >
            Anular venda
          </Link>
        </div>
      </div>

      <Card className="border-primary/20 shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Ajuste manual na posse (comodato)
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Use <strong>variação positiva</strong> para acrescentar unidades na posse
            ou <strong>negativa</strong> para reduzir (ex.: −3). Obrigatório informar
            justificativa — aparece na movimentação como ajuste.
          </p>
        </CardHeader>
        <CardContent>
          <form action={actionAjusteEstoque} className="space-y-4">
            <Field label="Vendedor (posse)" htmlFor="adj-vend">
              <select
                id="adj-vend"
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
            <Field label="Produto" htmlFor="adj-prod">
              <select
                id="adj-prod"
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
            <Field
              label="Variação (+ ou − unidades)"
              htmlFor="quantidadeDelta-op"
            >
              <Input
                id="quantidadeDelta-op"
                name="quantidadeDelta"
                type="number"
                required
                placeholder="ex: -2 ou 5"
              />
            </Field>
            <Field label="Justificativa" htmlFor="justificativa-op">
              <Textarea
                id="justificativa-op"
                name="justificativa"
                rows={3}
                required
                placeholder="Motivo do ajuste (auditoria)"
              />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              className="h-11 w-full rounded-xl font-semibold"
            >
              Aplicar ajuste na posse
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="opacity-95">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Devolução física ao depósito
          </CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Quando o vendedor devolve caixas ao armazém e o stock central deve subir
            (a posse do vendedor baixa na mesma operação). Para anular uma venda
            registada por engano, use{" "}
            <Link href="/devolucoes/nova" className="font-semibold text-primary">
              Corrigir venda
            </Link>
            .
          </p>
        </CardHeader>
        <CardContent>
          <form action={actionDevolucao} className="space-y-4">
            <Field label="Vendedor" htmlFor="dev-vend">
              <select
                id="dev-vend"
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
            <Field label="Produto" htmlFor="dev-prod">
              <select
                id="dev-prod"
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
            <Field label="Quantidade" htmlFor="quantidade-dev">
              <Input
                id="quantidade-dev"
                name="quantidade"
                type="number"
                min={1}
                required
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes-dev">
              <Textarea id="observacoes-dev" name="observacoes" rows={2} />
            </Field>
            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-semibold"
            >
              Registrar devolução ao central
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

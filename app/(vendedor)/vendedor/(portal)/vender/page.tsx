import { auth } from "@/lib/auth";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { actionVendaPortal } from "@/app/actions/vendedor-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorVenderPage() {
  const session = await auth();
  const rows = await listProdutosEmPosse(session!.user.sellerId!);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Nova venda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre a venda a partir do seu estoque em posse
        </p>
      </div>

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Sem unidades em posse para vender. Aguarde uma entrega em comodato ou
          fale com a operação.
        </PodPodEmptyHint>
      ) : (
        <form action={actionVendaPortal} className="space-y-5">
          <Field label="Produto" htmlFor="productId">
            <select
              id="productId"
              name="productId"
              required
              className={nativeSelectClassName}
            >
              <option value="">Selecione…</option>
              {rows.map((r) => (
                <option key={r.id} value={r.product.id}>
                  {r.product.nome} — {r.quantidade} u. (sug.{" "}
                  {formatBRL(Number(r.product.precoVendaSugerido))})
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
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            Confirmar venda
          </Button>
        </form>
      )}
    </div>
  );
}

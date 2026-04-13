import { auth } from "@/lib/auth";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { actionVendaPortal } from "@/app/actions/vendedor-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorVenderPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; quantidade?: string }>;
}) {
  const session = await auth();
  const rows = await listProdutosEmPosse(session!.user.sellerId!);
  const sp = await searchParams;
  const prefillProductId = (sp.productId ?? "").trim();
  const prefillRow = rows.find((r) => r.product.id === prefillProductId) ?? null;
  const qtdRaw = Number(sp.quantidade ?? "1");
  const prefillQuantidade = prefillRow
    ? Math.max(
        1,
        Math.min(
          prefillRow.quantidade,
          Number.isFinite(qtdRaw) ? Math.floor(qtdRaw) : 1
        )
      )
    : 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Nova venda
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use o que tem em posse para lançar a venda ao cliente
        </p>
      </div>

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Sem unidades em posse para vender. Aguarde uma entrega em comodato ou
          fale com a equipa.
        </PodPodEmptyHint>
      ) : (
        <form action={actionVendaPortal} className="space-y-5">
          {prefillRow ? (
            <p className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs font-medium text-foreground">
              Pedido do cardápio carregado: <strong>{prefillRow.product.nome}</strong>. O
              estoque só baixa ao confirmar esta venda.
            </p>
          ) : null}
          <Field label="Produto" htmlFor="productId">
            <select
              id="productId"
              name="productId"
              required
              defaultValue={prefillRow ? prefillRow.product.id : ""}
              className={nativeSelectClassName}
            >
              <option value="">Selecione…</option>
              {rows.map((r) => (
                <option key={r.id} value={r.product.id}>
                  {r.product.nome}
                  {r.product.marca ? ` · ${r.product.marca}` : ""}
                  {r.product.sabor ? ` · ${r.product.sabor}` : ""}
                  {` — ${r.quantidade} u. (sug. ${formatBRL(Number(r.product.precoVendaSugerido))})`}
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
              defaultValue={prefillQuantidade}
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

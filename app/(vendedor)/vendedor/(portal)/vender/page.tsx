import { auth } from "@/lib/auth";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { actionVendaPortal } from "@/app/actions/vendedor-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { VendaLoteItensFields } from "@/components/sales/venda-lote-itens-fields";

export default async function VendedorVenderPage({
  searchParams,
}: {
  searchParams: Promise<{
    productId?: string;
    quantidade?: string;
    ok?: string;
    error?: string;
  }>;
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
          Nova venda em lote
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use o que tem em posse para lançar uma ou várias vendas
        </p>
      </div>
      <FormSuccessBanner
        message={sp.ok === "1" ? "Venda em lote registrada com sucesso." : null}
      />
      <FormErrorBanner message={sp.error ? decodeURIComponent(sp.error) : null} />

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Sem unidades em posse para vender. Aguarde uma entrega em comodato ou
          fale com a equipa.
        </PodPodEmptyHint>
      ) : (
        <form action={actionVendaPortal} className="space-y-5">
          <input type="hidden" name="redirectAfter" value="/vendedor/vender" />
          {prefillRow ? (
            <p className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs font-medium text-foreground">
              Pedido do cardápio carregado: <strong>{prefillRow.product.nome}</strong>. O
              estoque só baixa ao confirmar esta venda.
            </p>
          ) : null}
          <VendaLoteItensFields
            options={rows.map((r) => ({
              value: r.product.id,
              label:
                `${r.product.nome}` +
                `${r.product.marca ? ` · ${r.product.marca}` : ""}` +
                `${r.product.sabor ? ` · ${r.product.sabor}` : ""}` +
                ` — ${r.quantidade} u. (sug. ${formatBRL(Number(r.product.precoVendaSugerido))})`,
            }))}
            initialRows={4}
            prefillProductId={prefillRow?.product.id}
            prefillQuantidade={prefillQuantidade}
          />
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
            Confirmar venda em lote
          </Button>
        </form>
      )}
    </div>
  );
}

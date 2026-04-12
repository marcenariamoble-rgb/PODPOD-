import { auth } from "@/lib/auth";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { actionDevolucaoPortal } from "@/app/actions/vendedor-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorDevolverPage() {
  const session = await auth();
  const rows = await listProdutosEmPosse(session!.user.sellerId!);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Devolução
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Devolva unidades ao estoque central
        </p>
      </div>

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Nada em posse para devolver. Quando tiver estoque, a devolução aparece
          aqui.
        </PodPodEmptyHint>
      ) : (
        <form action={actionDevolucaoPortal} className="space-y-5">
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
                  {r.product.nome} — máx. {r.quantidade} u.
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
          <Field label="Observação" htmlFor="observacoes">
            <Textarea id="observacoes" name="observacoes" rows={3} />
          </Field>
          <Button
            type="submit"
            variant="secondary"
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            Registrar devolução
          </Button>
        </form>
      )}
    </div>
  );
}

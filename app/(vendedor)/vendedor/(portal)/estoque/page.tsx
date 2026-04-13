import { auth } from "@/lib/auth";
import { listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorEstoquePage() {
  const session = await auth();
  const rows = await listProdutosEmPosse(session!.user.sellerId!);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Meu estoque
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quantidades que tem consigo neste momento
        </p>
      </div>

      {rows.length === 0 ? (
        <PodPodEmptyHint>
          Nenhum produto em posse no momento. Peça uma entrega em comodato à
          equipa.
        </PodPodEmptyHint>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              <p className="font-semibold leading-snug">{r.product.nome}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.product.marca}
                {r.product.sabor ? ` · ${r.product.sabor}` : ""}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {r.product.sku}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Quantidade
                  </p>
                  <p className="font-heading text-2xl font-bold tabular-nums">
                    {r.quantidade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">
                    Preço sugerido
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatBRL(Number(r.product.precoVendaSugerido))}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

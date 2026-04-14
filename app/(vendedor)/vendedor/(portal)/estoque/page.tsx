import { auth } from "@/lib/auth";
import { listMapaReposicaoRede, listProdutosEmPosse } from "@/lib/data/vendedor-portal";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

export default async function VendedorEstoquePage() {
  const session = await auth();
  const sellerId = session!.user.sellerId!;
  const [rows, rede] = await Promise.all([
    listProdutosEmPosse(sellerId),
    listMapaReposicaoRede(sellerId),
  ]);

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

      <div className="space-y-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Onde encontrar produto para reposição
        </h2>
        <p className="text-xs text-muted-foreground">
          Se estiver sem um item, veja abaixo se há no depósito central ou com outro vendedor.
        </p>
        {rede.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            Sem disponibilidade na rede no momento.
          </p>
        ) : (
          <ul className="space-y-2">
            {rede.slice(0, 20).map((p) => (
              <li key={p.id} className="rounded-xl border border-border/70 bg-card p-3 shadow-sm">
                <p className="font-medium leading-snug">{p.nome}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.marca}
                  {p.sabor ? ` · ${p.sabor}` : ""} · {p.sku}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Depósito: <span className="font-semibold text-foreground">{p.estoqueCentral}</span>{" "}
                  · Outros vendedores:{" "}
                  <span className="font-semibold text-foreground">{p.totalOutros}</span>
                </p>
                {p.outros.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Com:{" "}
                    {p.outros
                      .slice(0, 3)
                      .map((o) => `${o.sellerNome} (${o.quantidade})`)
                      .join(" · ")}
                    {p.outros.length > 3 ? " …" : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { listProdutosCardapio } from "@/lib/data/cardapio";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { formatBRL } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { PedirCardapioButton } from "@/components/cardapio/pedir-cardapio-button";

function isPublicImageUrl(url: string) {
  return (
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

function extractModeloNumero(text: string): number | null {
  const m = /(?:^|[^a-z0-9])v\s*(\d{2,4})(?:[^a-z0-9]|$)/i.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    marca?: string;
    codigo?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const catFiltro = (sp.categoria ?? "").trim();
  const marcaFiltro = (sp.marca ?? "").trim();
  const codigoIndicacao = (sp.codigo ?? "").trim();

  const todos = await listProdutosCardapio();
  const categorias = Array.from(
    new Set(todos.map((p) => p.categoria || "Outros"))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const marcas = Array.from(new Set(todos.map((p) => p.marca).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );

  let filtrados = todos;
  if (q) {
    filtrados = filtrados.filter((p) => {
      const blob = `${p.nome} ${p.marca} ${p.sabor} ${p.sku} ${p.categoria}`.toLowerCase();
      return blob.includes(q);
    });
  }
  if (marcaFiltro) {
    filtrados = filtrados.filter((p) => p.marca === marcaFiltro);
  }
  if (catFiltro) {
    filtrados = filtrados.filter((p) => (p.categoria || "Outros") === catFiltro);
  }

  const grupos = new Map<string, typeof filtrados>();
  for (const p of filtrados) {
    const c = p.categoria || "Outros";
    if (!grupos.has(c)) grupos.set(c, []);
    grupos.get(c)!.push(p);
  }
  const ordemCats = Array.from(grupos.keys()).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Produtos e preços
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Consulte o catálogo atualizado. Filtre por marca, categoria ou texto (nome, SKU…).
        </p>
        {codigoIndicacao ? (
          <p className="text-sm font-medium text-primary">
            Pedido com indicação direta (código:{" "}
            <span className="font-mono font-semibold">{codigoIndicacao}</span>). Só esse
            parceiro recebe o aviso deste pedido.
          </p>
        ) : null}
      </div>

      <form
        method="get"
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:flex-wrap sm:items-end"
      >
        {codigoIndicacao ? (
          <input type="hidden" name="codigo" value={codigoIndicacao} />
        ) : null}
        <Field label="Procurar" htmlFor="cardapio-q" className="min-w-[200px] flex-1">
          <input
            id="cardapio-q"
            name="q"
            type="search"
            defaultValue={sp.q ?? ""}
            placeholder="Nome, marca, SKU…"
            className={nativeSelectClassName}
          />
        </Field>
        <Field label="Marca" htmlFor="cardapio-marca" className="min-w-[160px]">
          <select
            id="cardapio-marca"
            name="marca"
            defaultValue={marcaFiltro}
            className={nativeSelectClassName}
          >
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria" htmlFor="cardapio-cat" className="min-w-[180px]">
          <select
            id="cardapio-cat"
            name="categoria"
            defaultValue={catFiltro}
            className={nativeSelectClassName}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="rounded-xl font-semibold">
            Filtrar
          </Button>
          <Link
            href="/cardapio"
            className={cn(
              buttonVariants({ variant: "ghost", size: "default" }),
              "rounded-xl font-semibold text-primary"
            )}
          >
            Limpar
          </Link>
        </div>
      </form>

      {filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
          <p className="font-medium text-muted-foreground">
            Nenhum produto encontrado com estes filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {ordemCats.map((categoria, idx) => {
            const itens = grupos.get(categoria) ?? [];
            const itensOrdenados = [...itens].sort((a, b) => {
              // 1) Sempre mostrar disponíveis primeiro.
              if (a.disponivel !== b.disponivel) return a.disponivel ? -1 : 1;
              // 2) Dentro da categoria, priorizar modelo numérico (V80 antes de V155).
              const na = extractModeloNumero(`${a.nome} ${a.marca} ${a.sabor ?? ""}`);
              const nb = extractModeloNumero(`${b.nome} ${b.marca} ${b.sabor ?? ""}`);
              if (na != null && nb != null && na !== nb) return na - nb;
              if (na != null && nb == null) return -1;
              if (na == null && nb != null) return 1;
              // 3) Desempate estável e previsível.
              return `${a.nome} ${a.marca} ${a.sabor ?? ""}`.localeCompare(
                `${b.nome} ${b.marca} ${b.sabor ?? ""}`,
                "pt-BR",
                { numeric: true, sensitivity: "base" }
              );
            });
            const headingId = `cardapio-cat-${idx}`;
            return (
              <section key={categoria} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="mb-4 border-b border-border/60 pb-2 font-heading text-lg font-semibold tracking-tight"
                >
                  {categoria}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {itensOrdenados.map((p) => {
                    const foto = p.fotoUrl?.trim();
                    const showImg = foto && isPublicImageUrl(foto);
                    const label = `${p.nome} — ${p.marca}${p.sabor ? ` (${p.sabor})` : ""}`;
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-[4/3] w-full bg-muted/40">
                          {showImg ? (
                            foto!.startsWith("/") ? (
                              <Image
                                src={foto!}
                                alt={p.nome}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 48vw"
                                quality={68}
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element -- URLs externas arbitrárias
                              <img
                                src={foto!}
                                alt={p.nome}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                              />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Package className="size-14 opacity-40" strokeWidth={1.25} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold leading-snug text-foreground">
                                {p.nome}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {p.marca}
                                {p.sabor ? ` · ${p.sabor}` : null}
                              </p>
                              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                                SKU {p.sku}
                              </p>
                            </div>
                            <Badge
                              variant={p.disponivel ? "success" : "secondary"}
                              className="shrink-0 rounded-lg font-semibold"
                            >
                              {p.disponivel ? "Disponível" : "Indisponível"}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-border/50 pt-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Preço sugerido
                              </p>
                              <p className="font-heading text-xl font-bold tabular-nums text-primary">
                                {formatBRL(p.precoVendaSugerido)}
                              </p>
                            </div>
                            <PedirCardapioButton
                              productId={p.id}
                              productLabel={label}
                              disponivel={p.disponivel}
                              estoqueCentral={p.estoqueCentral}
                              codigoIndicacaoInicial={codigoIndicacao}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

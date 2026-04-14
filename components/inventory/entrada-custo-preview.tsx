"use client";

import { useEffect, useMemo, useState } from "react";

type ProdutoPreview = {
  id: string;
  custoUnitario: number;
  estoqueCentral: number;
};

function parseDecimal(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

export function EntradaCustoPreview({ produtos }: { produtos: ProdutoPreview[] }) {
  const [productId, setProductId] = useState("");
  const [quantidade, setQuantidade] = useState(0);
  const [custoEntrada, setCustoEntrada] = useState<number | null>(null);

  useEffect(() => {
    const productEl = document.getElementById("productId") as HTMLSelectElement | null;
    const qtdEl = document.getElementById("quantidade") as HTMLInputElement | null;
    const custoEl = document.getElementById("custoUnitario") as HTMLInputElement | null;
    if (!productEl || !qtdEl || !custoEl) return;

    const sync = () => {
      setProductId(productEl.value);
      setQuantidade(Math.max(0, Math.floor(Number(qtdEl.value) || 0)));
      setCustoEntrada(parseDecimal(custoEl.value));
    };

    sync();
    productEl.addEventListener("change", sync);
    qtdEl.addEventListener("input", sync);
    custoEl.addEventListener("input", sync);
    return () => {
      productEl.removeEventListener("change", sync);
      qtdEl.removeEventListener("input", sync);
      custoEl.removeEventListener("input", sync);
    };
  }, []);

  const produto = useMemo(
    () => produtos.find((p) => p.id === productId) ?? null,
    [productId, produtos]
  );

  if (!produto || custoEntrada == null || quantidade <= 0) return null;

  const custoAtual = Number(produto.custoUnitario);
  const estoqueAtual = Number(produto.estoqueCentral);
  const base = estoqueAtual + quantidade;
  if (base <= 0) return null;
  const custoMedioNovo = Number(
    ((custoAtual * estoqueAtual + custoEntrada * quantidade) / base).toFixed(2)
  );

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.06] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Prévia de custo
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        Custo atual: <span className="tabular-nums">{formatBRL(custoAtual)}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        Novo custo médio estimado:{" "}
        <span className="tabular-nums font-semibold">{formatBRL(custoMedioNovo)}</span>
      </p>
    </div>
  );
}

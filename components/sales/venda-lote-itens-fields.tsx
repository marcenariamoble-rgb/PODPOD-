"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nativeSelectClassName } from "@/components/forms/form-field";

type Option = {
  value: string;
  label: string;
};

type Row = {
  key: string;
  productId: string;
  quantidade: string;
  valorUnitario: string;
};

function makeRow(seed: number, partial?: Partial<Row>): Row {
  return {
    key: `row-${seed}`,
    productId: partial?.productId ?? "",
    quantidade: partial?.quantidade ?? "",
    valorUnitario: partial?.valorUnitario ?? "",
  };
}

export function VendaLoteItensFields({
  options,
  initialRows = 3,
  prefillProductId,
  prefillQuantidade,
  valorUnitarioPorProduto,
  bloquearEdicaoValorUnitario = false,
  sellerSelectId,
  estoqueComodatoPorVendedorProduto,
}: {
  options: Option[];
  initialRows?: number;
  prefillProductId?: string;
  prefillQuantidade?: number;
  /** Mapa productId -> valor unitário (string com ponto decimal). */
  valorUnitarioPorProduto?: Record<string, string>;
  /** Quando true, valor unitário segue o produto e não pode ser editado. */
  bloquearEdicaoValorUnitario?: boolean;
  /** id do select de vendedor no mesmo form (ex.: "vendedorId"). */
  sellerSelectId?: string;
  /** Mapa sellerId -> productId -> qtd em comodato. */
  estoqueComodatoPorVendedorProduto?: Record<string, Record<string, number>>;
}) {
  const bootRows = useMemo(() => {
    const count = Math.max(1, initialRows);
    return Array.from({ length: count }).map((_, idx) =>
      makeRow(idx + 1, {
        productId: idx === 0 ? prefillProductId ?? "" : "",
        quantidade:
          idx === 0 && prefillQuantidade != null ? String(prefillQuantidade) : "",
      })
    );
  }, [initialRows, prefillProductId, prefillQuantidade]);

  const [rows, setRows] = useState<Row[]>(bootRows);
  const [seq, setSeq] = useState(rows.length + 1);
  const [sellerId, setSellerId] = useState("");

  useEffect(() => {
    if (!sellerSelectId) return;
    const el = document.getElementById(sellerSelectId) as HTMLSelectElement | null;
    if (!el) return;
    const onChange = () => setSellerId(el.value);
    onChange();
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, [sellerSelectId]);

  function addRow() {
    setRows((prev) => [...prev, makeRow(seq)]);
    setSeq((s) => s + 1);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  useEffect(() => {
    if (!bloquearEdicaoValorUnitario || !valorUnitarioPorProduto) return;
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        valorUnitario: row.productId ? (valorUnitarioPorProduto[row.productId] ?? "") : "",
      }))
    );
  }, [bloquearEdicaoValorUnitario, valorUnitarioPorProduto]);

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Preencha vários itens (linhas vazias são ignoradas).
        </p>
        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={addRow}>
          <Plus className="mr-1 size-4" />
          Adicionar linha
        </Button>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_95px_135px_auto]">
            <select
              name="productId"
              className={nativeSelectClassName}
              value={row.productId}
              onChange={(e) => {
                const productId = e.target.value;
                updateRow(row.key, {
                  productId,
                  ...(bloquearEdicaoValorUnitario
                    ? {
                        valorUnitario: productId
                          ? (valorUnitarioPorProduto?.[productId] ?? "")
                          : "",
                      }
                    : {}),
                });
              }}
            >
              <option value="">Produto #{idx + 1}</option>
              {options.map((op) => (
                <option key={`${row.key}-${op.value}`} value={op.value}>
                  {op.label}
                  {sellerId && estoqueComodatoPorVendedorProduto ? (
                    ` — comodato vendedor: ${
                      estoqueComodatoPorVendedorProduto[sellerId]?.[op.value] ?? 0
                    } u.`
                  ) : ""}
                </option>
              ))}
            </select>
            <Input
              name="quantidade"
              type="number"
              min={0}
              placeholder="Qtd"
              value={row.quantidade}
              onChange={(e) => updateRow(row.key, { quantidade: e.target.value })}
            />
            <Input
              name="valorUnitario"
              type="number"
              step="0.01"
              min={0}
              placeholder="Valor unit."
              value={row.valorUnitario}
              onChange={(e) => updateRow(row.key, { valorUnitario: e.target.value })}
              readOnly={bloquearEdicaoValorUnitario}
              aria-readonly={bloquearEdicaoValorUnitario}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(row.key)}
              title="Remover linha"
              disabled={rows.length <= 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

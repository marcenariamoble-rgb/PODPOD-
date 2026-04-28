"use client";

import { useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actionAtualizarVendaValor } from "@/app/actions/operations";

function parseMoneyInput(raw: string): number {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function EditarVendaValorButton({
  vendaId,
  produtoNome,
  valorUnitarioAtual,
  redirectAfter,
}: {
  vendaId: string;
  produtoNome: string;
  valorUnitarioAtual: number;
  redirectAfter: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    const current = valorUnitarioAtual.toFixed(2).replace(".", ",");
    const input = window.prompt(
      `Novo valor unitário para "${produtoNome}" (use vírgula ou ponto):`,
      current
    );
    if (input == null) return;
    const parsed = parseMoneyInput(input);
    if (!Number.isFinite(parsed) || parsed < 0) {
      window.alert("Valor inválido. Informe um número maior ou igual a zero.");
      return;
    }
    const ok = window.confirm(
      `Confirmar alteração do valor unitário de ${current} para ${parsed
        .toFixed(2)
        .replace(".", ",")} ?`
    );
    if (!ok) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("vendaId", vendaId);
      fd.set("valorUnitario", String(parsed));
      fd.set("redirectAfter", redirectAfter);
      await actionAtualizarVendaValor(fd);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={onClick}
      className="gap-1.5 rounded-lg font-semibold"
    >
      <Pencil className="size-3.5" />
      {pending ? "Salvando…" : "Editar valor"}
    </Button>
  );
}


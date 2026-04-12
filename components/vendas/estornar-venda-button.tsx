"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { actionEstornarVenda } from "@/app/actions/operations";
import { Undo2 } from "lucide-react";

export function EstornarVendaButton({
  vendaId,
  summary,
  redirectAfter,
  quantidadeAlocadaCentral,
  actionLabel = "Estornar",
}: {
  vendaId: string;
  summary: string;
  redirectAfter: string;
  quantidadeAlocadaCentral: number;
  /** Texto do botão (ex.: «Anular venda» na página de devoluções). */
  actionLabel?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const extra =
      quantidadeAlocadaCentral === 0
        ? "\n\nSem registro de unidades vindas do estoque central nesta venda (venda antiga ou tudo saiu da posse). Se na época o sistema alocou do central, confira o estoque central depois."
        : "";
    const ok = window.confirm(
      `Estornar esta venda?\n\n${summary}\n\n` +
        "O registro da venda será removido e as unidades voltam para o estoque (posse do vendedor e/ou central, conforme o caso)." +
        extra
    );
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("vendaId", vendaId);
      fd.set("redirectAfter", redirectAfter);
      await actionEstornarVenda(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="inline">
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        title={
          quantidadeAlocadaCentral === 0
            ? "Venda sem alocação do central registrada: em dúvida, confira o central após o estorno."
            : undefined
        }
        className="gap-1.5 rounded-lg border-destructive/40 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Undo2 className="size-3.5" />
        {pending ? "Estornando…" : actionLabel}
      </Button>
    </form>
  );
}

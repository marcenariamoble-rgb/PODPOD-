"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { actionDeleteSeller } from "@/app/actions/cadastros";
import { Trash2 } from "lucide-react";

export function DeleteSellerButton({
  sellerId,
  sellerName,
}: {
  sellerId: string;
  sellerName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = window.confirm(
      `Excluir definitivamente o vendedor "${sellerName}"?\n\n` +
        "Serão apagados: vendas, recebimentos, movimentações e estoque em posse deste vendedor. " +
        "Se existir utilizador da app ligado a ele, a conta continua com acesso ao painel como operador (sem área de vendedor). Esta ação não pode ser desfeita."
    );
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", sellerId);
      await actionDeleteSeller(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full sm:w-auto">
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
        className="w-full gap-2 rounded-xl font-semibold sm:w-auto"
      >
        <Trash2 className="size-4" />
        {pending ? "Excluindo…" : "Excluir vendedor"}
      </Button>
    </form>
  );
}

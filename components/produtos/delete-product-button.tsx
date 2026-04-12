"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { actionDeleteProduct } from "@/app/actions/cadastros";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ok = window.confirm(
      `Excluir definitivamente "${productName}"?\n\n` +
        "Serão apagados também: vendas, movimentações de estoque e linhas de estoque em vendedores ligadas a este produto. Esta ação não pode ser desfeita."
    );
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", productId);
      await actionDeleteProduct(fd);
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
        {pending ? "Excluindo…" : "Excluir produto"}
      </Button>
    </form>
  );
}

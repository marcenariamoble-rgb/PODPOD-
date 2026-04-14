"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  actionPedirCardapio,
  type PedirCardapioResult,
} from "@/app/actions/cardapio-publico";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  productId: string;
  productLabel: string;
  /** Só permite pedir quando há stock (depósito + comodato). */
  disponivel: boolean;
  /** Stock disponível para pedido (depósito + comodato). */
  estoqueDisponivel: number;
  /** Código de indicação (URL `?codigo=` ou preenchimento manual). */
  codigoIndicacaoInicial?: string;
};

function PedirCardapioForm({
  productId,
  productLabel,
  estoqueDisponivel,
  codigoIndicacaoInicial,
  onCancel,
  onSuccess,
}: Props & { onCancel: () => void; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<
    PedirCardapioResult | undefined,
    FormData
  >(actionPedirCardapio, undefined);

  useEffect(() => {
    if (state?.ok) onSuccess();
  }, [state?.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <p className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm font-medium text-foreground">
        {productLabel}
      </p>
      <Field label="Quantidade" htmlFor={`qtd-${productId}`}>
        <Input
          id={`qtd-${productId}`}
          name="quantidade"
          type="number"
          min={1}
          max={Math.min(99, estoqueDisponivel)}
          defaultValue={1}
          required
        />
      </Field>
      <Field label="Nome (opcional)" htmlFor={`nome-${productId}`}>
        <Input id={`nome-${productId}`} name="nomeContato" autoComplete="name" />
      </Field>
      <Field label="Telefone (opcional)" htmlFor={`tel-${productId}`}>
        <Input
          id={`tel-${productId}`}
          name="telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>
      <Field label="Observações" htmlFor={`obs-${productId}`}>
        <Textarea
          id={`obs-${productId}`}
          name="observacoes"
          rows={3}
          placeholder="Horário preferido, local de entrega…"
        />
      </Field>
      <Field
        label="Código de indicação (opcional)"
        htmlFor={`codigo-${productId}`}
      >
        <Input
          id={`codigo-${productId}`}
          name="codigoIndicacao"
          autoComplete="off"
          placeholder="Se lhe passaram um código de vendedor, introduza-o aqui"
          defaultValue={codigoIndicacaoInicial ?? ""}
        />
      </Field>
      {state && !state.ok ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {state.message}
        </p>
      ) : null}
      <DialogFooter className="gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl font-semibold"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="rounded-xl font-semibold"
          disabled={pending}
        >
          {pending ? "A enviar…" : "Enviar pedido"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PedirCardapioButton({
  productId,
  productLabel,
  disponivel,
  estoqueDisponivel,
  codigoIndicacaoInicial,
}: Props) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleOpenChange = (next: boolean) => {
    if (!disponivel) return;
    setOpen(next);
    if (next) setFormKey((k) => k + 1);
  };

  const onCancel = useCallback(() => setOpen(false), []);
  const onSuccess = useCallback(() => {
    window.setTimeout(() => setOpen(false), 1600);
  }, []);

  if (!disponivel) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="cursor-not-allowed rounded-xl font-semibold opacity-80"
        disabled
        title="Sem stock disponível (depósito + comodato) — não é possível pedir pelo cardápio"
      >
        Indisponível
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" size="sm" className="rounded-xl font-semibold">
            Pedir
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pedir produto</DialogTitle>
          <DialogDescription className="text-left">
            O pedido fica registado no painel da equipa. Indique como o podemos
            contactar (nome ou telefone obrigatório).
          </DialogDescription>
        </DialogHeader>
        <PedirCardapioForm
          key={formKey}
          productId={productId}
          productLabel={productLabel}
          disponivel={disponivel}
          estoqueDisponivel={estoqueDisponivel}
          codigoIndicacaoInicial={codigoIndicacaoInicial}
          onCancel={onCancel}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

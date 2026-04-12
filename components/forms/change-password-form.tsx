"use client";

import { useActionState } from "react";
import { actionAlterarMinhaSenha } from "@/app/actions/conta-senha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(actionAlterarMinhaSenha, {
    ok: false,
    message: "",
  });

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="senhaAtual" className="text-sm font-semibold">
          Senha atual
        </Label>
        <Input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="novaSenha" className="text-sm font-semibold">
          Nova senha
        </Label>
        <Input
          id="novaSenha"
          name="novaSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmarSenha" className="text-sm font-semibold">
          Confirmar nova senha
        </Label>
        <Input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-xl border border-success/35 bg-success/10 px-3 py-2 text-sm font-medium text-success"
              : "rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl font-semibold"
        disabled={pending}
      >
        {pending ? "A guardar…" : "Alterar senha"}
      </Button>
    </form>
  );
}

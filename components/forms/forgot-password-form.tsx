"use client";

import { useActionState } from "react";
import Link from "next/link";
import { actionSolicitarRedefinicaoSenha } from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    actionSolicitarRedefinicaoSenha,
    { ok: false, message: "" }
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold">
          E-mail da conta
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@empresa.com"
        />
      </div>
      {state.message ? (
        <p
          className={
            state.ok
              ? "rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success"
              : "rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl text-base font-semibold"
        disabled={pending}
      >
        {pending ? "Enviando…" : "Enviar instruções"}
      </Button>
      <p className="text-center text-sm font-medium text-muted-foreground">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}

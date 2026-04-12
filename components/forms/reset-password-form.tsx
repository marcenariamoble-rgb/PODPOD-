"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { actionRedefinirSenhaComToken } from "@/app/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Inner() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const [state, formAction, pending] = useActionState(
    actionRedefinirSenhaComToken,
    { ok: false, message: "" }
  );

  if (!token && !state.ok) {
    return (
      <p className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive">
        Link inválido. Use o endereço completo enviado por e-mail ou solicite um novo em{" "}
        <Link href="/forgot-password" className="underline">
          Esqueci a senha
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
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
          Confirmar senha
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
        disabled={pending || state.ok}
      >
        {pending ? "Guardando…" : "Guardar nova senha"}
      </Button>
      {state.ok ? (
        <p className="text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ir para o login
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export function ResetPasswordForm() {
  return <Inner />;
}

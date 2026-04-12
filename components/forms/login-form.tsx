"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@empresa.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p
          className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-xl text-base font-semibold"
        disabled={loading}
      >
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-sm font-medium">
        <Link
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Esqueci a senha
        </Link>
      </p>
    </form>
  );
}

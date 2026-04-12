import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="login-canvas relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(0.52 0.22 292 / 0.15), transparent 45%), radial-gradient(circle at 80% 0%, oklch(0.62 0.16 265 / 0.12), transparent 40%)",
        }}
      />
      <div className="relative w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <PodPodMark variant="hero" />
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              PodPod
            </h1>
            <p className="text-balance text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
              Controle de estoque, comodato e vendas — rápido e claro.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-card)] backdrop-blur-sm sm:p-8">
          <Suspense
            fallback={
              <p className="text-center text-sm font-medium text-muted-foreground">
                Carregando…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-sm font-medium">
          <Link
            href="/cardapio"
            className="text-primary underline-offset-4 hover:underline"
          >
            Ver cardápio de produtos e preços
          </Link>{" "}
          <span className="text-muted-foreground">(sem iniciar sessão)</span>
        </p>
        <p className="text-center text-xs font-medium text-muted-foreground">
          Uso interno — credenciais fornecidas pelo administrador.
        </p>
        <p className="text-center text-xs font-medium text-primary/90">
          App vendedor (PWA): após entrar com conta de vendedor, use{" "}
          <span className="whitespace-nowrap font-mono">/vendedor</span> ou
          instale pelo navegador.
        </p>
      </div>
    </div>
  );
}

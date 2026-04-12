import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { PodPodMark } from "@/components/brand/podpod-mark";

export default function ForgotPasswordPage() {
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
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Esqueci a senha
            </h1>
            <p className="text-balance text-sm font-medium text-muted-foreground">
              Indique o e-mail da conta. Se existir, enviamos um link para criar uma nova senha
              (requer e-mail configurado no servidor).
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-[var(--shadow-card)] backdrop-blur-sm sm:p-8">
          <ForgotPasswordForm />
        </div>
        <p className="text-center text-xs font-medium text-muted-foreground">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}

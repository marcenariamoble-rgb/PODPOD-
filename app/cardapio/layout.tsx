import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cardápio de produtos",
  description: "Preços sugeridos e disponibilidade dos produtos — PodPod",
};

export default async function CardapioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const painelHref =
    session?.user?.role === "VENDEDOR" ? "/vendedor" : "/dashboard";
  const painelLabel =
    session?.user?.role === "VENDEDOR" ? "Área do vendedor" : "Painel";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <PodPodMark variant="nav" className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight">
                <BookOpen className="size-5 shrink-0 text-primary" />
                Cardápio
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Preços e disponibilidade
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {session?.user ? (
              <Link
                href={painelHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl font-semibold"
                )}
              >
                {painelLabel}
              </Link>
            ) : (
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "rounded-xl font-semibold"
                )}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-border/60 bg-muted/20 py-6 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-lg px-4">
          Valores são preços sugeridos. «Disponível» indica que o produto pode
          ser fornecido; «Indisponível» significa que não há saldo para entrega
          imediata neste momento.
        </p>
      </footer>
    </div>
  );
}

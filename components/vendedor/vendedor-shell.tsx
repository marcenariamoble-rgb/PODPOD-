"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Package,
  ShoppingCart,
  Undo2,
  LogOut,
  BookOpen,
  Bell,
} from "lucide-react";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/vendedor", label: "Início", icon: Home, end: true },
  { href: "/vendedor/estoque", label: "Estoque", icon: Package },
  { href: "/vendedor/vender", label: "Vender", icon: ShoppingCart },
  { href: "/vendedor/devolver", label: "Devolver", icon: Undo2 },
];

export function VendedorShell({
  children,
  notificacoesCardapioNaoLidas = 0,
}: {
  children: React.ReactNode;
  /** Pedidos do cardápio ainda não lidos (área /vendedor/pedidos-cardapio). */
  notificacoesCardapioNaoLidas?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-4 py-3 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <PodPodMark variant="nav" className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold tracking-tight text-foreground">
                PodPod
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                Área do vendedor
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              href="/vendedor/pedidos-cardapio"
              className="relative inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
              title="Pedidos do cardápio"
            >
              <Bell className="size-[18px] text-primary" strokeWidth={2.25} />
              {notificacoesCardapioNaoLidas > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                  {notificacoesCardapioNaoLidas > 99
                    ? "99+"
                    : notificacoesCardapioNaoLidas}
                </span>
              ) : null}
              <span className="max-[380px]:sr-only">Pedidos</span>
            </Link>
            <Link
              href="/cardapio"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <BookOpen className="size-4" />
              Cardápio
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-xl border-border/80 px-3 font-semibold"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-card/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_oklch(0.25_0.04_285_/_0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg justify-around px-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.end
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[4.25rem] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "bg-muted/80"
                  )}
                >
                  <Icon className="size-[20px]" strokeWidth={active ? 2.25 : 2} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

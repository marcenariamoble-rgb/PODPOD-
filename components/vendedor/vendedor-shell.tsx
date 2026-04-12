"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Home,
  Package,
  ShoppingCart,
  Undo2,
  LogOut,
  BookOpen,
  Bell,
  KeyRound,
} from "lucide-react";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VendedorPedidosCardapioPoller } from "@/components/vendedor/vendedor-pedidos-cardapio-poller";
import { VendedorNotificacoesOptIn } from "@/components/vendedor/vendedor-notificacoes-opt-in";

const nav = [
  { href: "/vendedor", label: "Início", icon: Home, end: true },
  {
    href: "/vendedor/pedidos-cardapio",
    label: "Pedidos",
    icon: Bell,
    pedidosBadge: true as const,
  },
  { href: "/vendedor/estoque", label: "Estoque", icon: Package },
  { href: "/vendedor/vender", label: "Vender", icon: ShoppingCart },
  { href: "/vendedor/devolver", label: "Devolver", icon: Undo2 },
];

function navItemActive(pathname: string, href: string, end?: boolean) {
  if (href === "/vendedor") return pathname === "/vendedor";
  if (href === "/vendedor/pedidos-cardapio") {
    return pathname.startsWith("/vendedor/pedidos-cardapio");
  }
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VendedorShell({
  children,
  notificacoesCardapioNaoLidas = 0,
}: {
  children: React.ReactNode;
  /** Pedidos do cardápio ainda não lidos (área /vendedor/pedidos-cardapio). */
  notificacoesCardapioNaoLidas?: number;
}) {
  const pathname = usePathname();
  const [pedidosNaoLidos, setPedidosNaoLidos] = useState(notificacoesCardapioNaoLidas);
  const onPedidosCount = useCallback((n: number) => {
    setPedidosNaoLidos(n);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <VendedorPedidosCardapioPoller
        initialCount={notificacoesCardapioNaoLidas}
        onCount={onPedidosCount}
      />
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
              {pedidosNaoLidos > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                  {pedidosNaoLidos > 99 ? "99+" : pedidosNaoLidos}
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
            <Link
              href="/vendedor/conta/senha"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border/80 bg-card px-2.5 font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              title="Alterar senha"
            >
              <KeyRound className="size-[18px]" strokeWidth={2.25} />
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

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        <VendedorNotificacoesOptIn />
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/70 bg-card/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_oklch(0.25_0.04_285_/_0.08)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg justify-around gap-0.5 px-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = navItemActive(
              pathname,
              item.href,
              "end" in item ? item.end : undefined
            );
            const showPedidosDot =
              "pedidosBadge" in item && item.pedidosBadge && pedidosNaoLidos > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold leading-tight transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-2xl transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "bg-muted/80"
                  )}
                >
                  <Icon className="size-[20px]" strokeWidth={active ? 2.25 : 2} />
                  {showPedidosDot ? (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-destructive" />
                  ) : null}
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

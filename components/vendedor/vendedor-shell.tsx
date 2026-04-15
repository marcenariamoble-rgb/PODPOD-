"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Home,
  Package,
  ShoppingCart,
  Undo2,
  Coffee,
  LogOut,
  BookOpen,
  Bell,
  KeyRound,
} from "lucide-react";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { VendedorPedidosCardapioPoller } from "@/components/vendedor/vendedor-pedidos-cardapio-poller";
import { VendedorNotificacoesOptIn } from "@/components/vendedor/vendedor-notificacoes-opt-in";
import { VendedorInstallPrompt } from "@/components/pwa/vendedor-install-prompt";

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
  { href: "/vendedor/consumo-proprio", label: "Consumo", icon: Coffee },
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
  const [showNovoPedidoAlert, setShowNovoPedidoAlert] = useState(false);
  const onPedidosCount = useCallback((n: number) => {
    setPedidosNaoLidos(n);
  }, []);
  const onPedidosIncrease = useCallback(() => {
    setShowNovoPedidoAlert(true);
  }, []);

  useEffect(() => {
    if (!showNovoPedidoAlert) return;
    const id = window.setTimeout(() => setShowNovoPedidoAlert(false), 12000);
    return () => window.clearTimeout(id);
  }, [showNovoPedidoAlert]);

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <VendedorPedidosCardapioPoller
        initialCount={notificacoesCardapioNaoLidas}
        onCount={onPedidosCount}
        onIncrease={onPedidosIncrease}
      />
      {showNovoPedidoAlert ? (
        <div className="sticky top-0 z-30 border-b border-primary/30 bg-primary/10 px-3 py-2 sm:px-4">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground sm:text-sm">
              Novo pedido recebido no cardápio.
            </p>
            <Link
              href="/vendedor/pedidos-cardapio"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-8 rounded-lg px-3 text-xs font-semibold"
              )}
              onClick={() => setShowNovoPedidoAlert(false)}
            >
              Abrir
            </Link>
          </div>
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-border/70 bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur-lg sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-2 sm:max-w-none sm:gap-3">
            <PodPodMark variant="nav" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <p className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg">
                PodPod
              </p>
              <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
                O seu painel
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_auto] items-center justify-end gap-1 sm:flex-none sm:gap-1.5 sm:gap-2">
            <Link
              href="/vendedor/pedidos-cardapio"
              className="relative inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80 sm:px-2.5"
              title="Pedidos do cardápio"
            >
              <Bell className="size-[18px] text-primary" strokeWidth={2.25} />
              {pedidosNaoLidos > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
                  {pedidosNaoLidos > 99 ? "99+" : pedidosNaoLidos}
                </span>
              ) : null}
              <span className="hidden sm:inline">Pedidos</span>
            </Link>
            <Link
              href="/cardapio"
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:gap-1.5 sm:px-3"
              title="Ver cardápio público"
            >
              <BookOpen className="size-4 shrink-0" />
              <span className="hidden min-[380px]:inline">Cardápio</span>
            </Link>
            <Link
              href="/vendedor/conta/senha"
              className="inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-border/80 bg-card px-2 font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              title="Alterar senha"
            >
              <KeyRound className="size-[18px] shrink-0" strokeWidth={2.25} />
              <span className="hidden text-xs sm:inline">Senha</span>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-1 rounded-xl border-border/80 px-2 font-semibold sm:gap-1.5 sm:px-3"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        <VendedorInstallPrompt />
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
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] font-semibold leading-[1.15] transition-colors sm:gap-1 sm:py-2 sm:text-[10px] sm:leading-tight",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all sm:size-11",
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "bg-muted/80"
                  )}
                >
                  <Icon className="size-[18px] sm:size-[20px]" strokeWidth={active ? 2.25 : 2} />
                  {showPedidosDot ? (
                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-destructive" />
                  ) : null}
                </span>
                <span className="max-w-[4.25rem] text-center [overflow-wrap:anywhere] sm:max-w-[5rem]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

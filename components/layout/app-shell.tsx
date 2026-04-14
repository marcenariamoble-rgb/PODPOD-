"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Users,
  ArrowLeftRight,
  FileBarChart,
  Menu,
  Truck,
  LogOut,
  PackagePlus,
  ArrowDownToLine,
  Boxes,
  SlidersHorizontal,
  ChevronDown,
  Receipt,
  Landmark,
  BookOpen,
  ClipboardList,
  UserCog,
  Coffee,
} from "lucide-react";
import { PodPodMark } from "@/components/brand/podpod-mark";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "next-auth/react";

const mainNav = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/pedidos-cardapio", label: "Pedidos cardápio", icon: ClipboardList },
  { href: "/vendas", label: "Vendas", icon: Receipt },
  { href: "/consumo-proprio", label: "Consumo próprio", icon: Coffee },
  { href: "/financeiro", label: "Financeiro", icon: Landmark },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/vendedores", label: "Vendedores", icon: Users },
  { href: "/usuarios", label: "Utilizadores", icon: UserCog },
];

/** Estoque e comodato; vendas ficam no painel /vendas. */
const operacoesAgrupadas = [
  {
    title: "Estoque",
    items: [
      { href: "/estoque/entrada", label: "Nova entrada", icon: PackagePlus },
      { href: "/movimentacoes/saida", label: "Saída manual", icon: ArrowDownToLine },
      { href: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Comodato",
    items: [
      { href: "/comodato", label: "Entrega comodato", icon: Truck, end: true },
      { href: "/comodato/estoque", label: "Estoque em comodato", icon: Boxes },
      {
        href: "/comodato/operacoes",
        label: "Ajustar comodato",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    title: "Consultas",
    items: [
      { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
      { href: "/cardapio", label: "Cardápio (público)", icon: BookOpen },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
  end,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
  /** Se true, só marca ativo no path exato (ex.: /comodato sem /comodato/estoque). */
  end?: boolean;
}) {
  const pathname = usePathname();
  const active = end
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex min-h-[2.25rem] items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium leading-tight transition-colors duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
          active
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        <Icon className="size-4" strokeWidth={active ? 2.25 : 2} />
      </span>
      <span className="min-w-0 flex-1 break-words">{label}</span>
    </Link>
  );
}

function SidebarQuickOps() {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-1.5 border-t border-sidebar-border/55 pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-1 rounded-md px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/90",
          "outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/50"
        )}
        aria-expanded={open}
      >
        Operações rápidas
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 opacity-80 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="mt-1 space-y-2">
          {operacoesAgrupadas.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mobileMain = [
    mainNav[0],
    mainNav[1],
    mainNav[3],
    { href: "__more__", label: "Menu", icon: Menu },
  ] as const; // Painel, Vendas, Produtos, Menu (Financeiro fica no menu completo)

  return (
    <div className="flex min-h-dvh w-full app-canvas">
      <aside className="relative hidden w-[15rem] shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar/95 shadow-[4px_0_20px_oklch(0.25_0.04_285_/_0.035)] backdrop-blur-sm md:flex lg:w-[15.5rem]">
        <div className="shrink-0 border-b border-sidebar-border/70 px-3 pb-3 pt-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 rounded-xl outline-none transition-opacity hover:opacity-95"
          >
            <PodPodMark variant="sidebar" className="shrink-0 scale-[0.92]" />
            <div className="min-w-0 leading-tight">
              <p className="font-heading text-base font-bold tracking-tight text-foreground">
                PodPod
              </p>
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                Operação &amp; estoque
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2 py-2.5">
          <p className="mb-0.5 px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">
            Menu
          </p>
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
          <SidebarQuickOps />
        </nav>
        <div className="shrink-0 space-y-2 border-t border-sidebar-border/70 p-2.5">
          <Link
            href="/conta/senha"
            className="flex h-9 w-full items-center justify-center rounded-lg border border-border/70 bg-card/40 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            Alterar senha
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full justify-center gap-1.5 rounded-lg border-border/80 bg-card/50 text-xs font-semibold"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-3.5 opacity-80" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-[4.25rem] md:pb-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <PodPodMark variant="nav" className="h-9 w-9" />
            <span className="font-heading text-base font-bold tracking-tight">
              PodPod
            </span>
          </Link>
          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100%,21rem)] border-l border-border/60 bg-sidebar/98 backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-border/50 pb-3 text-left">
                <SheetTitle className="font-heading text-base">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-3 flex max-h-[min(70dvh,32rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1">
                <p className="mb-0.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/85">
                  Navegação
                </p>
                {mainNav.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
                <SidebarQuickOps />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 h-9 gap-1.5 rounded-lg text-xs font-semibold"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="size-3.5" />
                  Sair
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-card/90 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-0.5 shadow-[0_-6px_24px_oklch(0.25_0.04_285_/_0.06)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5">
          {mobileMain.map((item) => {
            if (item.href === "__more__") {
              return (
                <Sheet key="more">
                  <SheetTrigger
                    type="button"
                    className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted/80">
                      <Menu className="size-[17px]" />
                    </span>
                    Menu
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="h-auto max-h-[88dvh] rounded-t-3xl border-t border-border/60"
                  >
                    <SheetHeader className="text-left">
                      <SheetTitle className="font-heading text-lg">
                        Atalhos
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href="/vendas"
                        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm font-semibold shadow-sm transition-all hover:border-primary/45 hover:bg-primary/10"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <Receipt className="size-[18px]" strokeWidth={2.25} />
                        </span>
                        Painel de vendas
                      </Link>
                      <Link
                        href="/financeiro"
                        className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm font-semibold shadow-sm transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-800 dark:text-emerald-300">
                          <Landmark className="size-[18px]" strokeWidth={2.25} />
                        </span>
                        Financeiro
                      </Link>
                      {operacoesAgrupadas.flatMap((g) => g.items).map((op) => (
                        <Link
                          key={op.href}
                          href={op.href}
                          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-sm font-semibold shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <op.icon className="size-[18px]" strokeWidth={2.25} />
                          </span>
                          {op.label}
                        </Link>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-semibold transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/70"
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={active ? 2.25 : 2} />
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

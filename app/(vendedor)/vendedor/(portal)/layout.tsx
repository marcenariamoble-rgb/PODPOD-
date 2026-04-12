import type { Viewport } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VendedorShell } from "@/components/vendedor/vendedor-shell";
import { countNotificacoesCardapioNaoLidas } from "@/lib/data/cardapio-notificacoes";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#a020f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0014" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function VendedorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/vendedor");
  if (session.user.role !== "VENDEDOR") redirect("/dashboard");

  const sellerId = session.user.sellerId;
  const notificacoesCardapioNaoLidas = sellerId
    ? await countNotificacoesCardapioNaoLidas(sellerId)
    : 0;

  return (
    <VendedorShell notificacoesCardapioNaoLidas={notificacoesCardapioNaoLidas}>
      {children}
    </VendedorShell>
  );
}

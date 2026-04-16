import type { Viewport } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VendedorShell } from "@/components/vendedor/vendedor-shell";
import { countNotificacoesCardapioNaoLidas } from "@/lib/data/cardapio-notificacoes";
import { prisma } from "@/lib/db";

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
  const [notificacoesCardapioNaoLidas, sellerConfig] = await Promise.all([
    sellerId ? countNotificacoesCardapioNaoLidas(sellerId) : Promise.resolve(0),
    sellerId
      ? prisma.seller.findUnique({
          where: { id: sellerId },
          select: { consumoProprioHabilitado: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <VendedorShell
      notificacoesCardapioNaoLidas={notificacoesCardapioNaoLidas}
      consumoProprioHabilitado={sellerConfig?.consumoProprioHabilitado ?? true}
    >
      {children}
    </VendedorShell>
  );
}

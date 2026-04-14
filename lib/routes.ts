/** Rotas do painel administrativo (vendedor não acessa) */
export const ADMIN_ROUTE_PREFIXES = [
  "/dashboard",
  "/produtos",
  "/vendedores",
  "/usuarios",
  "/conta",
  "/movimentacoes",
  "/relatorios",
  "/comodato",
  "/vendas",
  "/devolucoes",
  "/recebimentos",
  "/pedidos-cardapio",
  "/consumo-proprio",
] as const;

export function isAdminRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  return ADMIN_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function isVendedorArea(pathname: string): boolean {
  return pathname === "/vendedor" || pathname.startsWith("/vendedor/");
}

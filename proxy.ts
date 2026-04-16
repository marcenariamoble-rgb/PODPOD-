import { NextResponse } from "next/server";
import { auth } from "@/lib/auth.edge";
import { isAdminRoute, isVendedorArea } from "@/lib/routes";

/**
 * Usa `auth` de `auth.edge` (sem Prisma) — compatível com Proxy/Edge.
 * Importar `auth` de `lib/auth.ts` puxa Prisma e pode anular a sessão.
 */
export default auth((req) => {
  const path = req.nextUrl.pathname;

  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    path === "/sw.js" ||
    path === "/manifest.webmanifest" ||
    path === "/manifest.json" ||
    path.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const session = req.auth;
  const logged = !!session?.user;
  const role = session?.user?.role;
  const isVendedor = role === "VENDEDOR";

  const isLogin = path === "/login";
  const isOffline = path === "/vendedor/offline";
  const isCardapioPublico = path === "/cardapio" || path.startsWith("/cardapio/");
  const isPasswordRecovery =
    path === "/forgot-password" || path === "/reset-password";

  if (logged && isLogin) {
    const cb = req.nextUrl.searchParams.get("callbackUrl");
    if (cb && cb.startsWith("/") && !cb.startsWith("//")) {
      if (isVendedor && !cb.startsWith("/vendedor")) {
        return NextResponse.redirect(new URL("/vendedor", req.url));
      }
      if (!isVendedor && cb.startsWith("/vendedor")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.redirect(new URL(cb, req.url));
    }
    return NextResponse.redirect(
      new URL(isVendedor ? "/vendedor" : "/dashboard", req.url)
    );
  }

  if (!logged && !isLogin && !isOffline && !isCardapioPublico && !isPasswordRecovery) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (logged && isVendedor && isAdminRoute(path)) {
    return NextResponse.redirect(new URL("/vendedor", req.url));
  }

  if (logged && !isVendedor && isVendedorArea(path) && !isOffline) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|manifest.json).*)",
  ],
};

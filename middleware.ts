import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAdminRoute, isVendedorArea } from "@/lib/routes";

export async function middleware(req: NextRequest) {
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

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn("AUTH_SECRET ausente — middleware de auth limitado.");
  }

  const token = await getToken({
    req,
    secret: secret ?? "dev-insecure-placeholder",
  });
  const logged = !!token;
  const role = token?.role as string | undefined;
  const isVendedor = role === "VENDEDOR";

  const isLogin = path === "/login";
  const isOffline = path === "/vendedor/offline";
  const isCardapioPublico = path === "/cardapio" || path.startsWith("/cardapio/");

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

  if (!logged && !isLogin && !isOffline && !isCardapioPublico) {
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
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|manifest.json).*)",
  ],
};

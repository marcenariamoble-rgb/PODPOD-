import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: "ADMIN" | "OPERADOR" | "VENDEDOR";
    sellerId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "OPERADOR" | "VENDEDOR";
      sellerId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    sellerId?: string | null;
  }
}

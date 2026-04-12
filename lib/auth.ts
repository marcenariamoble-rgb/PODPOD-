import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        });
        const parsed = schema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.ativo) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.senhaHash);
        if (!ok) return null;

        if (user.role === "VENDEDOR" && !user.sellerId) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          sellerId: user.sellerId,
        };
      },
    }),
  ],
});

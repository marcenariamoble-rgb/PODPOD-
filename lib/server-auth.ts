import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Utilizador autenticado com papel de backoffice (ADMIN ou OPERADOR). */
export async function requireStaffUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "VENDEDOR") {
    throw new Error("Sem permissão para esta operação.");
  }
  return session.user.id;
}

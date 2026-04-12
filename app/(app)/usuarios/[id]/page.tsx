import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { actionAtualizarUsuario, actionAdminDefinirSenha } from "@/app/actions/usuarios";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  VENDEDOR: "Vendedor",
};

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; password?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [user, sellers] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { seller: { select: { id: true, nome: true } } },
    }),
    prisma.seller.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <FormSuccessBanner
        message={
          sp.saved === "1"
            ? "Dados guardados."
            : sp.password === "1"
              ? "Senha redefinida pelo administrador."
              : null
        }
      />
      <FormErrorBanner message={sp.error ? decodeURIComponent(sp.error) : null} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {user.nome}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {roleLabel[user.role] ?? user.role} · {user.email}
          </p>
        </div>
        <Link
          href="/usuarios"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Lista
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados do utilizador</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionAtualizarUsuario} className="space-y-4">
            <input type="hidden" name="id" value={user.id} />
            <Field label="Nome" htmlFor="nome">
              <Input
                id="nome"
                name="nome"
                required
                defaultValue={user.nome}
              />
            </Field>
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={user.email}
              />
            </Field>
            <Field label="Perfil" htmlFor="role">
              <select
                id="role"
                name="role"
                required
                className={nativeSelectClassName}
                defaultValue={user.role}
              >
                <option value="ADMIN">Administrador</option>
                <option value="OPERADOR">Operador</option>
                <option value="VENDEDOR">Vendedor</option>
              </select>
            </Field>
            <Field label="Vendedor (perfil vendedor)" htmlFor="sellerId">
              <select
                id="sellerId"
                name="sellerId"
                className={nativeSelectClassName}
                defaultValue={user.sellerId ?? ""}
              >
                <option value="">— nenhum —</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/15 px-3 py-2">
              <input
                id="ativo"
                name="ativo"
                type="checkbox"
                value="true"
                defaultChecked={user.ativo}
                className="size-4 rounded border-border"
                aria-label="Conta ativa"
              />
              <Label htmlFor="ativo" className="text-sm font-medium">
                Conta ativa
              </Label>
            </div>
            <Button type="submit" className="w-full rounded-xl font-semibold">
              Guardar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Redefinir senha (administrador)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionAdminDefinirSenha} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <Field label="Nova senha" htmlFor="novaSenha">
              <Input
                id="novaSenha"
                name="novaSenha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar" htmlFor="confirmarSenha">
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                minLength={8}
              />
            </Field>
            <Button type="submit" variant="secondary" className="w-full rounded-xl font-semibold">
              Definir nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

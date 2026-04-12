import Link from "next/link";
import { prisma } from "@/lib/db";
import { actionCreateUsuario } from "@/app/actions/usuarios";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { cn } from "@/lib/utils";

export default async function NovoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const sellers = await prisma.seller.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Novo utilizador
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Credenciais iniciais — o utilizador pode alterar a senha depois
          </p>
        </div>
        <Link
          href="/usuarios"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Voltar
        </Link>
      </div>

      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Dados de acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionCreateUsuario} className="space-y-4">
            <Field label="Nome" htmlFor="nome">
              <Input id="nome" name="nome" required placeholder="Nome completo" />
            </Field>
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="email@empresa.com"
              />
            </Field>
            <Field label="Senha inicial" htmlFor="senha">
              <Input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </Field>
            <Field label="Perfil" htmlFor="role">
              <select
                id="role"
                name="role"
                required
                className={nativeSelectClassName}
                defaultValue="OPERADOR"
              >
                <option value="ADMIN">Administrador</option>
                <option value="OPERADOR">Operador</option>
                <option value="VENDEDOR">Vendedor</option>
              </select>
            </Field>
            <Field label="Vendedor (só perfil vendedor)" htmlFor="sellerId">
              <select
                id="sellerId"
                name="sellerId"
                className={nativeSelectClassName}
                defaultValue=""
              >
                <option value="">— selecione —</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs font-medium text-muted-foreground">
              Para vendedor, escolha o cadastro de vendedor já existente em Vendedores.
            </p>
            <Button type="submit" className="w-full rounded-xl font-semibold">
              Criar utilizador
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

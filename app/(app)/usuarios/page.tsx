import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  OPERADOR: "Operador",
  VENDEDOR: "Vendedor",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { created, error } = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: { nome: "asc" },
    include: { seller: { select: { nome: true } } },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <FormSuccessBanner
        message={created === "1" ? "Utilizador criado com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Utilizadores
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Contas de acesso ao PodPod (login e perfis)
          </p>
        </div>
        <Link
          href="/usuarios/novo"
          className={cn(
            buttonVariants({ size: "sm" }),
            "inline-flex rounded-xl font-semibold"
          )}
        >
          <Plus className="mr-1.5 size-4" />
          Novo utilizador
        </Link>
      </div>

      {users.length === 0 ? (
        <PodPodEmptyHint>
          Crie o primeiro utilizador com <strong>Novo utilizador</strong>.
        </PodPodEmptyHint>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="hidden max-w-[200px] truncate font-mono text-xs sm:table-cell">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabel[u.role] ?? u.role}</Badge>
                    {u.role === "VENDEDOR" && u.seller ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {u.seller.nome}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {u.ativo ? (
                      <Badge variant="outline" className="border-success/40 text-success">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="warning">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/usuarios/${u.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "font-semibold text-primary"
                      )}
                    >
                      Editar
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

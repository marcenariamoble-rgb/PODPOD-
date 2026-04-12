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
import { getSellerFinancialTotals } from "@/lib/services/calculations.service";
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";

export default async function VendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const { error, deleted } = await searchParams;
  const vendedores = await prisma.seller.findMany({
    orderBy: { nome: "asc" },
  });

  const balances = await Promise.all(
    vendedores.map(async (v) => {
      const b = await getSellerFinancialTotals(v.id);
      return { id: v.id, ...b };
    })
  );
  const map = Object.fromEntries(balances.map((b) => [b.id, b]));

  return (
    <div className="flex w-full flex-col gap-6">
      <FormSuccessBanner
        message={deleted === "1" ? "Vendedor excluído com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Vendedores
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Parceiros e saldos a receber
          </p>
        </div>
        <Link
          href="/vendedores/novo"
          className={cn(
            buttonVariants({ size: "sm" }),
            "inline-flex rounded-xl font-semibold"
          )}
        >
          <Plus className="mr-1.5 size-4" />
          Novo vendedor
        </Link>
      </div>
      {vendedores.length === 0 ? (
        <PodPodEmptyHint>
          Cadastre o primeiro vendedor com o botão <strong>Novo vendedor</strong>.
        </PodPodEmptyHint>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Cidade</TableHead>
              <TableHead className="text-right">A receber</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendedores.map((v) => {
              const b = map[v.id];
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {v.cidade ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {formatBRL(b?.saldoPendente ?? 0)}
                  </TableCell>
                  <TableCell>
                    {v.ativo ? (
                      <Badge variant="success" className="font-semibold">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/vendedores/${v.id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "rounded-lg font-semibold text-primary"
                      )}
                    >
                      Ver / editar
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}

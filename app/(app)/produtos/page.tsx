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
import { formatBRL } from "@/lib/utils/format";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { FormErrorBanner } from "@/components/forms/form-error-banner";
import { FormSuccessBanner } from "@/components/forms/form-success-banner";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const { error, deleted } = await searchParams;
  const produtos = await prisma.product.findMany({
    orderBy: { nome: "asc" },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <FormSuccessBanner
        message={deleted === "1" ? "Produto excluído com sucesso." : null}
      />
      <FormErrorBanner message={error ? decodeURIComponent(error) : null} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Catálogo e estoque central
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/produtos/novo"
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            <Plus className="mr-1.5 size-4" />
            Novo produto
          </Link>
          <Link
            href="/estoque/entrada"
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "inline-flex rounded-xl font-semibold"
            )}
          >
            Nova entrada
          </Link>
        </div>
      </div>
      {produtos.length === 0 ? (
        <PodPodEmptyHint>
          Ainda não há produtos no catálogo. Use <strong>Novo produto</strong> para
          começar.
        </PodPodEmptyHint>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Marca</TableHead>
              <TableHead className="text-right">Central</TableHead>
              <TableHead className="text-right">Mín.</TableHead>
              <TableHead className="text-right">Pço sug.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((p) => {
              const baixo = p.estoqueCentral <= p.estoqueMinimo;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{p.marca}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.estoqueCentral}
                    {baixo ? (
                      <Badge variant="warning" className="ml-2 font-semibold">
                        Estoque baixo
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.estoqueMinimo}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(p.precoVendaSugerido))}
                  </TableCell>
                  <TableCell>
                    {p.ativo ? (
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
                      href={`/produtos/${p.id}`}
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

import type { Prisma } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";

export const RECEBIMENTOS_PAGE_SIZE = 50;

const FORMA_ESTORNO = "Ajuste (estorno de venda)";
const OBS_ESTORNO_MARKER = "Libera cobertura";

export type RecebimentoOrigemFiltro = "todos" | "manual" | "estorno";

export type ListRecebimentosFilters = {
  vendedorId?: string;
  de?: string;
  ate?: string;
  origem?: RecebimentoOrigemFiltro;
  page?: number;
};

function toNumber(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

export function isRecebimentoEstornoAutomatico(r: {
  observacoes: string | null;
  formaPagamento: string;
}): boolean {
  return (
    r.formaPagamento === FORMA_ESTORNO ||
    (r.observacoes?.includes(OBS_ESTORNO_MARKER) ?? false)
  );
}

function whereOrigem(origem: RecebimentoOrigemFiltro): Prisma.RecebimentoWhereInput | null {
  if (origem === "todos") return null;
  if (origem === "estorno") {
    return {
      OR: [
        { formaPagamento: FORMA_ESTORNO },
        { observacoes: { contains: OBS_ESTORNO_MARKER, mode: "insensitive" } },
      ],
    };
  }
  return {
    AND: [
      { formaPagamento: { not: FORMA_ESTORNO } },
      {
        OR: [
          { observacoes: null },
          {
            NOT: {
              observacoes: { contains: OBS_ESTORNO_MARKER, mode: "insensitive" },
            },
          },
        ],
      },
    ],
  };
}

export function buildRecebimentoWhere(
  filters: ListRecebimentosFilters
): Prisma.RecebimentoWhereInput {
  const where: Prisma.RecebimentoWhereInput = {};

  if (filters.vendedorId) {
    where.vendedorId = filters.vendedorId;
  }

  if (filters.de || filters.ate) {
    where.createdAt = {};
    if (filters.de) {
      const d = new Date(filters.de);
      if (!Number.isNaN(d.getTime())) {
        where.createdAt.gte = startOfDay(d);
      }
    }
    if (filters.ate) {
      const d = new Date(filters.ate);
      if (!Number.isNaN(d.getTime())) {
        where.createdAt.lte = endOfDay(d);
      }
    }
  }

  const origem = filters.origem ?? "todos";
  const origemWhere = whereOrigem(origem);
  if (origemWhere) {
    return { AND: [where, origemWhere] };
  }

  return where;
}

export async function listRecebimentosAdmin(filters: ListRecebimentosFilters) {
  const where = buildRecebimentoWhere(filters);
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * RECEBIMENTOS_PAGE_SIZE;

  const [rows, total, agg] = await Promise.all([
    prisma.recebimento.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: RECEBIMENTOS_PAGE_SIZE,
      skip,
      include: { vendedor: { select: { id: true, nome: true } } },
    }),
    prisma.recebimento.count({ where }),
    prisma.recebimento.aggregate({
      where,
      _sum: { valorRecebido: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / RECEBIMENTOS_PAGE_SIZE));

  return {
    rows,
    total,
    totalValor: toNumber(agg._sum.valorRecebido),
    page,
    pageSize: RECEBIMENTOS_PAGE_SIZE,
    totalPages,
  };
}

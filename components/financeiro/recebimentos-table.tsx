import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PodPodEmptyHint } from "@/components/brand/podpod-empty-hint";
import { isRecebimentoEstornoAutomatico } from "@/lib/services/recebimentos.service";
import { formatBRL } from "@/lib/utils/format";

export type RecebimentoTableRow = {
  id: string;
  /** Data do evento (quando o vendedor repassou). */
  dataRecebimento: Date;
  /** Quando o registro foi lançado no sistema. */
  createdAt: Date;
  valorRecebido: { toString(): string } | number;
  formaPagamento: string;
  observacoes: string | null;
  vendedor: { id: string; nome: string };
};

/** Considera "lançado em data diferente" quando a diferença passa de ~1 min. */
function foiLancadoRetroativo(dataRecebimento: Date, createdAt: Date): boolean {
  return Math.abs(createdAt.getTime() - dataRecebimento.getTime()) > 60_000;
}

export function RecebimentosTable({
  rows,
  showVendedor = true,
  emptyMessage = "Nenhum recebimento com estes filtros.",
}: {
  rows: RecebimentoTableRow[];
  showVendedor?: boolean;
  emptyMessage?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          {showVendedor ? <TableHead>Vendedor</TableHead> : null}
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Forma</TableHead>
          <TableHead className="hidden sm:table-cell">Observação</TableHead>
          <TableHead className="w-[1%]">Tipo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showVendedor ? 6 : 5} className="p-0">
              <PodPodEmptyHint className="mx-2 my-3 border-0 bg-muted/10 py-8">
                {emptyMessage}
              </PodPodEmptyHint>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => {
            const estorno = isRecebimentoEstornoAutomatico(r);
            return (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs tabular-nums">
                  {format(r.dataRecebimento, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  {foiLancadoRetroativo(r.dataRecebimento, r.createdAt) ? (
                    <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                      lançado {format(r.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  ) : null}
                </TableCell>
                {showVendedor ? (
                  <TableCell className="font-medium">
                    <Link
                      href={`/vendedores/${r.vendedor.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {r.vendedor.nome}
                    </Link>
                  </TableCell>
                ) : null}
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatBRL(Number(r.valorRecebido))}
                </TableCell>
                <TableCell className="max-w-[8rem] truncate text-sm sm:max-w-none">
                  {r.formaPagamento}
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:table-cell">
                  {r.observacoes ?? "—"}
                </TableCell>
                <TableCell>
                  {estorno ? (
                    <Badge variant="outline" className="whitespace-nowrap font-semibold">
                      Estorno
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="whitespace-nowrap font-semibold">
                      Manual
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

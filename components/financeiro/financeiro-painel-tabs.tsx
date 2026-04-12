"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatInt } from "@/lib/utils/format";
import type {
  FinanceiroCategoriaRow,
  FinanceiroRegiaoRow,
  FinanceiroVendedorRow,
} from "@/lib/services/financeiro-painel.service";

type GlobalFin = {
  totalVendas: number;
  totalSaldoRepasse: number;
  totalRecebido: number;
  aReceber: number;
};

type ResumoProps = {
  global: GlobalFin;
  vendasPeriodo: number;
  recebimentosPeriodo: number;
  periodoLabel: string;
};

export function FinanceiroPainelTabs({
  resumo,
  vendedores,
  categorias,
  regioes,
}: {
  resumo: ResumoProps;
  vendedores: FinanceiroVendedorRow[];
  categorias: FinanceiroCategoriaRow[];
  regioes: FinanceiroRegiaoRow[];
}) {
  const { global, vendasPeriodo, recebimentosPeriodo, periodoLabel } = resumo;

  return (
    <Tabs defaultValue="resumo" className="w-full gap-4">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0"
      >
        <TabsTrigger value="resumo" className="rounded-lg px-3 py-2">
          Resumo
        </TabsTrigger>
        <TabsTrigger value="vendedores" className="rounded-lg px-3 py-2">
          Por vendedor
        </TabsTrigger>
        <TabsTrigger value="categorias" className="rounded-lg px-3 py-2">
          Por categoria
        </TabsTrigger>
        <TabsTrigger value="regioes" className="rounded-lg px-3 py-2">
          Por região
        </TabsTrigger>
      </TabsList>

      <TabsContent value="resumo" className="mt-4 space-y-4">
        <p className="text-xs font-medium text-muted-foreground">
          Período do quadro intermédio:{" "}
          <span className="text-foreground">{periodoLabel}</span> (ajuste pelo filtro
          acima). Os totais de saldo a receber são acumulados (posição atual).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Vendas no período
            </p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums">
              {formatBRL(vendasPeriodo)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recebimentos no período
            </p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums">
              {formatBRL(recebimentosPeriodo)}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A receber (empresa)
            </p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums text-primary">
              {formatBRL(global.aReceber)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Saldo de repasse ainda não coberto pelos recebimentos
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Já recebido (acumulado)
            </p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums">
              {formatBRL(global.totalRecebido)}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Faturamento bruto (histórico)
            </p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums">
              {formatBRL(global.totalVendas)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Soma de todas as vendas registadas
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Saldo a repasse (histórico)
            </p>
            <p className="mt-1 font-heading text-lg font-bold tabular-nums">
              {formatBRL(global.totalSaldoRepasse)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              O que os vendedores devem repassar à empresa (soma das linhas de venda)
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="vendedores" className="mt-4">
        <div className="overflow-x-auto rounded-2xl border border-border/70 shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="hidden sm:table-cell">Local</TableHead>
                <TableHead className="text-right">Vendas (bruto)</TableHead>
                <TableHead className="hidden text-right md:table-cell">
                  Repasse
                </TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum vendedor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                vendedores.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/vendedores/${r.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {r.nome}
                      </Link>
                      <div className="mt-0.5 sm:hidden">
                        {!r.ativo ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Inativo
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:table-cell">
                      {[r.cidade, r.regiao].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.totalVendas)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">
                      {formatBRL(r.totalSaldoRepasse)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.totalRecebido)}
                    </TableCell>
                    <TableCell
                      className={
                        r.saldoPendente > 0
                          ? "text-right font-semibold tabular-nums text-amber-700 dark:text-amber-400"
                          : "text-right tabular-nums text-muted-foreground"
                      }
                    >
                      {formatBRL(r.saldoPendente)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="categorias" className="mt-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Volume de vendas por linha de produto (categoria do cadastro).
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border/70 shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Sem vendas registadas.
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((c) => (
                  <TableRow key={c.categoria}>
                    <TableCell className="font-medium">{c.categoria}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(c.quantidade)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatBRL(c.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="regioes" className="mt-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Consolidação por região do vendedor (campo &quot;região&quot; no cadastro).
          Vendedores sem região aparecem em &quot;Sem região&quot;.
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border/70 shadow-[var(--shadow-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead className="text-right">Parceiros</TableHead>
                <TableHead className="text-right">Vendas (bruto)</TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  Repasse
                </TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regioes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Sem dados.
                  </TableCell>
                </TableRow>
              ) : (
                regioes.map((r) => (
                  <TableRow key={r.regiao}>
                    <TableCell className="font-medium">{r.regiao}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.vendedores}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.totalVendas)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {formatBRL(r.totalSaldoRepasse)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.totalRecebido)}
                    </TableCell>
                    <TableCell
                      className={
                        r.saldoPendente > 0
                          ? "text-right font-semibold tabular-nums text-amber-700 dark:text-amber-400"
                          : "text-right tabular-nums text-muted-foreground"
                      }
                    >
                      {formatBRL(r.saldoPendente)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

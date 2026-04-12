"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatInt } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export type DashboardClientProps = {
  vendasVendedor: { nome: string; valor: number; quantidade: number }[];
  vendasProduto: { nome: string; valor: number; quantidade: number }[];
  recebimentosDia: { dia: string; valor: number }[];
  estoqueVendedor: { nome: string; quantidade: number }[];
};

const tooltipStyles = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid oklch(0.91 0.015 280)",
    boxShadow: "0 8px 24px oklch(0.25 0.04 285 / 0.12)",
    fontSize: "13px",
    fontWeight: 500,
  },
  labelStyle: { fontWeight: 600, marginBottom: "4px" },
};

function truncateLabel(s: string, max = 14) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ChartShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="font-heading text-base font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <p className="text-xs font-medium text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pb-4 pt-0 sm:px-5">
        <div className="relative w-full min-h-0 min-w-0">
          <div className="h-[240px] w-full min-w-0 sm:h-[280px]">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({
  vendasVendedor,
  vendasProduto,
  recebimentosDia,
  estoqueVendedor,
}: DashboardClientProps) {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <ChartShell
        title="Vendas por vendedor"
        description="Valor no período selecionado"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={vendasVendedor}
            margin={{ top: 8, left: 0, right: 8, bottom: 4 }}
            barCategoryGap="18%"
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="oklch(0.91 0.015 280)"
            />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={truncateLabel}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={52}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={(v) => formatInt(Number(v))}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [formatBRL(Number(value ?? 0)), "Valor"]}
              labelFormatter={(l) => String(l)}
            />
            <Bar
              dataKey="valor"
              name="Valor"
              fill="var(--color-chart-1)"
              radius={[8, 8, 4, 4]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Vendas por produto"
        description="Ranking por valor no período"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={vendasProduto}
            layout="vertical"
            margin={{ top: 8, left: 4, right: 12, bottom: 4 }}
            barCategoryGap="16%"
          >
            <CartesianGrid
              strokeDasharray="4 4"
              horizontal={false}
              stroke="oklch(0.91 0.015 280)"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={(v) => formatInt(Number(v))}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nome"
              width={108}
              tick={{ fontSize: 10, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={(v) => truncateLabel(String(v), 16)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [formatBRL(Number(value ?? 0)), "Valor"]}
            />
            <Bar
              dataKey="valor"
              name="Valor"
              fill="var(--color-chart-2)"
              radius={[0, 8, 8, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Recebimentos por dia"
        description="Entradas confirmadas no período"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={recebimentosDia}
            margin={{ top: 8, left: 0, right: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="oklch(0.91 0.015 280)"
            />
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 10, fill: "oklch(0.48 0.03 285)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={(v) => formatInt(Number(v))}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [
                formatBRL(Number(value ?? 0)),
                "Recebido",
              ]}
            />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="var(--color-chart-4)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--color-chart-4)", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Estoque em posse"
        description="Unidades atualmente com cada vendedor"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={estoqueVendedor}
            margin={{ top: 8, left: 0, right: 8, bottom: 4 }}
            barCategoryGap="18%"
          >
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="oklch(0.91 0.015 280)"
            />
            <XAxis
              dataKey="nome"
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              tickFormatter={(v) => truncateLabel(String(v))}
              interval={0}
              angle={-16}
              textAnchor="end"
              height={48}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "oklch(0.48 0.03 285)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              {...tooltipStyles}
              formatter={(value) => [
                formatInt(Number(value ?? 0)),
                "Unidades",
              ]}
            />
            <Bar
              dataKey="quantidade"
              name="Unidades"
              fill="var(--color-chart-3)"
              radius={[8, 8, 4, 4]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  );
}

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  actionMarcarPedidoCardapioVisualizado,
  actionMarcarTodosPedidosCardapioVisualizados,
} from "@/app/actions/pedidos-cardapio";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppMeUrl } from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils";

export default async function PedidosCardapioPage() {
  const rows = await prisma.solicitacaoCardapio.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      produto: {
        select: { nome: true, sku: true },
      },
    },
  });

  const pendentes = rows.filter((r) => !r.visualizado).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-lg border-0 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              Operações
            </Badge>
            {pendentes > 0 ? (
              <Badge variant="default" className="rounded-lg font-semibold">
                {pendentes} novo(s)
              </Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Pedidos do cardápio
          </h1>
          <p className="mt-1 max-w-xl text-sm font-medium text-muted-foreground">
            Pedidos enviados pelo botão «Pedir» no cardápio público. Marque como
            visto depois de tratar o pedido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pedidos-cardapio/alertas"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "rounded-xl font-semibold"
            )}
          >
            Notificar vendedores
          </Link>
          {pendentes > 0 ? (
            <form action={actionMarcarTodosPedidosCardapioVisualizados}>
              <Button type="submit" variant="outline" className="rounded-xl font-semibold">
                Marcar todos como vistos
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center text-sm font-medium text-muted-foreground">
          Ainda não há pedidos pelo cardápio.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="tabular-nums">Qtd</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-[1%] text-end">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const waUrl = buildWhatsAppMeUrl(r.telefone);
                return (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                    {format(r.createdAt, "d MMM yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{r.produto.nome}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                      {r.produto.sku}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{r.quantidade}</TableCell>
                  <TableCell className="max-w-[min(280px,100%)]">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm break-words">
                        {[r.nomeContato, r.telefone]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "w-fit gap-1.5 border-emerald-600/35 bg-emerald-50/80 text-emerald-900 hover:border-emerald-600/50 hover:bg-emerald-100/90 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70"
                          )}
                        >
                          <MessageCircle
                            className="size-3.5 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2.25}
                          />
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                    {r.observacoes?.trim() || "—"}
                  </TableCell>
                  <TableCell className="text-end">
                    {r.visualizado ? (
                      <Badge variant="secondary" className="rounded-lg font-semibold">
                        Visto
                      </Badge>
                    ) : (
                      <form
                        action={actionMarcarPedidoCardapioVisualizado}
                        className="inline"
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-xl font-semibold"
                        >
                          Marcar visto
                        </Button>
                      </form>
                    )}
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Relatórios
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            A base do sistema já permite exportar dados via Prisma e telas de
            listagem. Na próxima iteração: filtros por período, estoque geral /
            por vendedor, inadimplência, ranking de produtos e vendedores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

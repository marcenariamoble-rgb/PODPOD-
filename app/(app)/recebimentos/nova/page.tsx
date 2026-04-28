import Link from "next/link";
import { actionRecebimento } from "@/app/actions/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, nativeSelectClassName } from "@/components/forms/form-field";
import { listVendedoresAtivos } from "@/lib/data/catalog";

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function NovoRecebimentoPage() {
  const vendedores = await listVendedoresAtivos();
  const nowInput = toDateTimeLocalValue(new Date());

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Recebimento
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Registe o valor que o vendedor lhe repassa. Para quem já desconta comissão
            na venda, informe o montante do saldo líquido (não o valor cheio ao
            cliente). O sistema aplica o pagamento às vendas por ordem de data do
            recebimento informado.
          </p>
        </div>
        <Link
          href="/vendas"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "shrink-0 rounded-lg font-semibold text-primary"
          )}
        >
          Voltar
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Registrar pagamento do vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionRecebimento} className="space-y-4">
            <Field label="Vendedor" htmlFor="vendedorId">
              <select
                id="vendedorId"
                name="vendedorId"
                required
                className={nativeSelectClassName}
              >
                <option value="">Selecione…</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valor recebido (R$)" htmlFor="valorRecebido">
              <Input
                id="valorRecebido"
                name="valorRecebido"
                type="number"
                step="0.01"
                min={0.01}
                required
              />
            </Field>
            <Field label="Forma de pagamento" htmlFor="formaPagamento">
              <Input id="formaPagamento" name="formaPagamento" required />
            </Field>
            <Field label="Data/hora do recebimento" htmlFor="dataRecebimento">
              <Input
                id="dataRecebimento"
                name="dataRecebimento"
                type="datetime-local"
                defaultValue={nowInput}
                required
              />
            </Field>
            <Field label="Observação" htmlFor="observacoes">
              <Textarea id="observacoes" name="observacoes" rows={3} />
            </Field>
            <Button type="submit" className="h-11 w-full rounded-xl font-semibold">
              Salvar recebimento
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

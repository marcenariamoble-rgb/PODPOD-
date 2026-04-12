import { Info } from "lucide-react";

type Estado = "ok" | "env-invalido" | "sem-env";

export function EstoqueGeralHint({
  estado,
  nomeDetentor,
}: {
  estado: Estado;
  nomeDetentor?: string;
}) {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Info className="size-[18px]" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="font-semibold leading-snug">Estoque geral</p>
        {estado === "ok" && nomeDetentor ? (
          <p className="font-medium leading-relaxed text-muted-foreground">
            As entradas no central são atribuídas a{" "}
            <span className="text-foreground">{nomeDetentor}</span> como detentor
            do depósito (registo nas movimentações com este vendedor).
          </p>
        ) : null}
        {estado === "sem-env" ? (
          <p className="font-medium leading-relaxed text-muted-foreground">
            Para associar entradas ao detentor do estoque geral, defina{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              PODPOD_ESTOQUE_GERAL_SELLER_ID
            </code>{" "}
            no ficheiro{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env</code>{" "}
            (ID do vendedor Ronan Nanuncio no sistema).
          </p>
        ) : null}
        {estado === "env-invalido" ? (
          <p className="font-medium leading-relaxed text-destructive">
            O ID em{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              PODPOD_ESTOQUE_GERAL_SELLER_ID
            </code>{" "}
            não corresponde a um vendedor. Corrija o .env ou o cadastro.
          </p>
        ) : null}
      </div>
    </div>
  );
}

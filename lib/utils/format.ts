export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

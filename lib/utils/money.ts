type DecimalLike = { toNumber?: () => number; toString: () => string };

export function toNumber(value: DecimalLike | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value.toNumber === "function") return value.toNumber();
  return Number(value.toString());
}

const MIN_LEN = 3;
const MAX_LEN = 20;

/** Código válido para gravar no pedido e para notificação (mesmas regras do cadastro do vendedor). */
export function resolveCodigoIndicacaoPedido(
  raw: string | null | undefined
): string | null {
  const n = normalizeCodigoIndicacao(raw);
  if (n.length < MIN_LEN || n.length > MAX_LEN) return null;
  return n;
}

/**
 * Normaliza código de indicação do cardápio para armazenamento e comparação
 * (maiúsculas, apenas letras e dígitos).
 */
export function normalizeCodigoIndicacao(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return raw.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function parseCodigoVendaParaGuardar(
  raw: string | null | undefined
): { ok: true; value: string | null } | { ok: false; error: string } {
  const t = String(raw ?? "").trim();
  if (t === "") return { ok: true, value: null };
  const n = normalizeCodigoIndicacao(t);
  if (n.length < MIN_LEN) {
    return {
      ok: false,
      error: `Código de venda inválido (use ${MIN_LEN}–${MAX_LEN} letras ou números).`,
    };
  }
  if (n.length > MAX_LEN) {
    return {
      ok: false,
      error: `Código demasiado longo (máx. ${MAX_LEN} caracteres).`,
    };
  }
  return { ok: true, value: n };
}

export type BuildWhatsAppMeUrlOptions = {
  /** Texto pré-preenchido na conversa (parâmetro `text` do wa.me). */
  text?: string | null;
};

/**
 * URL https://wa.me/... para abrir conversa no WhatsApp (Web ou app).
 * Aceita texto com espaços, traços, parênteses; usa só dígitos.
 * Números brasileiros típicos (10–11 dígitos sem DDI) recebem prefixo 55.
 */
export function buildWhatsAppMeUrl(
  phone: string | null | undefined,
  options?: BuildWhatsAppMeUrlOptions
): string | null {
  if (!phone?.trim()) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;

  let base: string | null = null;
  if (d.startsWith("55") && d.length >= 12) {
    base = `https://wa.me/${d}`;
  } else if (d.length >= 10 && d.length <= 11) {
    base = `https://wa.me/55${d}`;
  } else if (d.length >= 10) {
    base = `https://wa.me/${d}`;
  }
  if (!base) return null;

  const t = options?.text?.trim();
  if (t) {
    return `${base}?text=${encodeURIComponent(t)}`;
  }
  return base;
}

/**
 * Mensagem sugerida para o primeiro contacto com o cliente após um pedido pelo cardápio.
 */
export function buildMensagemPrimeiroContactoCardapio(opts: {
  nomeContato?: string | null;
  produtoNome: string;
  quantidade: number;
}): string {
  const nome = opts.nomeContato?.trim();
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";
  const q = opts.quantidade;
  const u = q === 1 ? "unidade" : "unidades";
  return `${saudacao} Aqui é a equipa PodPod, a responder ao seu pedido no cardápio: ${opts.produtoNome} (${q} ${u}). Em que podemos ajudar?`;
}

/**
 * Dígitos só, formato internacional, para a API do WhatsApp Cloud (campo `to`).
 * Ex.: (11) 98765-4321 → 5511987654321
 */
export function toWhatsAppApiRecipientDigits(
  phone: string | null | undefined
): string | null {
  if (!phone?.trim()) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length >= 10 && d.length <= 11) return `55${d}`;
  if (d.length >= 10) return d;
  return null;
}

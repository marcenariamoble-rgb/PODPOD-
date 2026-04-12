/**
 * URL https://wa.me/... para abrir conversa no WhatsApp (Web ou app).
 * Aceita texto com espaços, traços, parênteses; usa só dígitos.
 * Números brasileiros típicos (10–11 dígitos sem DDI) recebem prefixo 55.
 */
export function buildWhatsAppMeUrl(
  phone: string | null | undefined
): string | null {
  if (!phone?.trim()) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return null;

  if (d.startsWith("55") && d.length >= 12) {
    return `https://wa.me/${d}`;
  }
  if (d.length >= 10 && d.length <= 11) {
    return `https://wa.me/55${d}`;
  }
  if (d.length >= 10) {
    return `https://wa.me/${d}`;
  }
  return null;
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

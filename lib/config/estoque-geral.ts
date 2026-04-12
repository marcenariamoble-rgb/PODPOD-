/**
 * Vendedor que representa o depósito / estoque geral (quem “recebe” as entradas no sistema).
 * Defina `PODPOD_ESTOQUE_GERAL_SELLER_ID` no `.env` com o ID do cadastro (ex.: seed `seed-estoque-geral`).
 */
export function getDetentorEstoqueGeralSellerId(): string | null {
  const id = process.env.PODPOD_ESTOQUE_GERAL_SELLER_ID?.trim();
  return id && id.length > 0 ? id : null;
}

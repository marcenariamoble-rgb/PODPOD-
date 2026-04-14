-- Indicação direta no cardápio: código por vendedor e registo no pedido.

ALTER TABLE "SolicitacaoCardapio" ADD COLUMN IF NOT EXISTS "codigoIndicacao" TEXT;

ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "codigoVenda" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Seller_codigoVenda_key" ON "Seller"("codigoVenda");

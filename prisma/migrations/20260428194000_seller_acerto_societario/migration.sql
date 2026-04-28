-- AlterTable Seller
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "acertoSocietarioAtivo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "acertoSocietarioPercentual" DECIMAL(5,2);

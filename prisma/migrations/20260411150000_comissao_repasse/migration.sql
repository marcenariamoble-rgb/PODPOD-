-- CreateEnum
CREATE TYPE "ComissaoVendedorTipo" AS ENUM ('NENHUMA', 'PERCENTUAL_SOBRE_VENDA', 'FIXA_POR_UNIDADE');

-- AlterTable Seller
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "comissaoDescontaNaVenda" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "comissaoTipo" "ComissaoVendedorTipo" NOT NULL DEFAULT 'NENHUMA';
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "comissaoPercentual" DECIMAL(5,2);
ALTER TABLE "Seller" ADD COLUMN IF NOT EXISTS "comissaoPorUnidade" DECIMAL(12,2);

-- AlterTable Venda
ALTER TABLE "Venda" ADD COLUMN IF NOT EXISTS "valorComissaoRetida" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Venda" ADD COLUMN IF NOT EXISTS "valorSaldoRepasse" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "Venda" SET "valorSaldoRepasse" = "valorTotal" WHERE "valorSaldoRepasse" = 0 AND "valorTotal" IS NOT NULL;

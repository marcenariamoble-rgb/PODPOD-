-- AlterEnum
ALTER TYPE "TipoMovimentacao" ADD VALUE IF NOT EXISTS 'ESTORNO_VENDA';

-- AlterTable
ALTER TABLE "Venda" ADD COLUMN IF NOT EXISTS "quantidadeAlocadaCentral" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MovimentacaoEstoque" ADD COLUMN IF NOT EXISTS "vendaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MovimentacaoEstoque_vendaId_key" ON "MovimentacaoEstoque"("vendaId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MovimentacaoEstoque_vendaId_fkey'
  ) THEN
    ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_vendaId_fkey"
      FOREIGN KEY ("vendaId") REFERENCES "Venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

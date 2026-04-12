-- AlterTable
ALTER TABLE "Product" ADD COLUMN "fotoUrl" TEXT;

-- CreateTable
CREATE TABLE "SolicitacaoCardapio" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "nomeContato" TEXT,
    "telefone" TEXT,
    "observacoes" TEXT,
    "visualizado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitacaoCardapio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitacaoCardapio_productId_idx" ON "SolicitacaoCardapio"("productId");

-- CreateIndex
CREATE INDEX "SolicitacaoCardapio_visualizado_createdAt_idx" ON "SolicitacaoCardapio"("visualizado", "createdAt");

-- AddForeignKey
ALTER TABLE "SolicitacaoCardapio" ADD CONSTRAINT "SolicitacaoCardapio_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

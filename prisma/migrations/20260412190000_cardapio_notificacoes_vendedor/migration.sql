-- CreateTable
CREATE TABLE "CardapioAlertaVendedor" (
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardapioAlertaVendedor_pkey" PRIMARY KEY ("sellerId")
);

-- CreateTable
CREATE TABLE "NotificacaoSolicitacaoCardapio" (
    "id" TEXT NOT NULL,
    "solicitacaoCardapioId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoSolicitacaoCardapio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoSolicitacaoCardapio_solicitacaoCardapioId_sellerId_key" ON "NotificacaoSolicitacaoCardapio"("solicitacaoCardapioId", "sellerId");

-- CreateIndex
CREATE INDEX "NotificacaoSolicitacaoCardapio_sellerId_lida_createdAt_idx" ON "NotificacaoSolicitacaoCardapio"("sellerId", "lida", "createdAt");

-- AddForeignKey
ALTER TABLE "CardapioAlertaVendedor" ADD CONSTRAINT "CardapioAlertaVendedor_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoSolicitacaoCardapio" ADD CONSTRAINT "NotificacaoSolicitacaoCardapio_solicitacaoCardapioId_fkey" FOREIGN KEY ("solicitacaoCardapioId") REFERENCES "SolicitacaoCardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoSolicitacaoCardapio" ADD CONSTRAINT "NotificacaoSolicitacaoCardapio_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

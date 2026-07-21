-- Separa a "data do recebimento" (evento, escolhida no formulário) do carimbo
-- real de criação do registro (createdAt). Antes, o createdAt era sobrescrito
-- com a data do evento; agora passam a ser campos distintos.

-- 1) Nova coluna, inicialmente nullable para permitir o backfill.
ALTER TABLE "Recebimento" ADD COLUMN "dataRecebimento" TIMESTAMP(3);

-- 2) Backfill: registros existentes tinham a data do evento gravada em createdAt.
UPDATE "Recebimento" SET "dataRecebimento" = "createdAt" WHERE "dataRecebimento" IS NULL;

-- 3) Torna obrigatória e define default para novos registros.
ALTER TABLE "Recebimento" ALTER COLUMN "dataRecebimento" SET NOT NULL;
ALTER TABLE "Recebimento" ALTER COLUMN "dataRecebimento" SET DEFAULT CURRENT_TIMESTAMP;

-- 4) Índice para ordenação/filtro por data do evento por vendedor.
CREATE INDEX "Recebimento_vendedorId_dataRecebimento_idx" ON "Recebimento"("vendedorId", "dataRecebimento");

-- Controle de acesso ao menu "Consumo próprio" por vendedor.
ALTER TABLE "Seller"
ADD COLUMN IF NOT EXISTS "consumoProprioHabilitado" BOOLEAN NOT NULL DEFAULT true;

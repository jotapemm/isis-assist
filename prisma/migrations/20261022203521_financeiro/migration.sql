-- CreateEnum
CREATE TYPE "StatusCobranca" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'DINHEIRO', 'TRANSFERENCIA', 'BOLETO', 'CARTAO', 'OUTRA');

-- CreateEnum
CREATE TYPE "OrigemPagamento" AS ENUM ('MANUAL', 'GATEWAY');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('IPTU', 'CONDOMINIO', 'AGUA', 'LUZ', 'GAS', 'INTERNET', 'MANUTENCAO', 'SEGURO', 'TAXAS', 'OUTROS');

-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "despesaId" TEXT,
ADD COLUMN     "pagamentoId" TEXT;

-- CreateTable
CREATE TABLE "cobranca" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "competencia" DATE NOT NULL,
    "vencimento" DATE NOT NULL,
    "valor" INTEGER NOT NULL,
    "descricao" TEXT,
    "status" "StatusCobranca" NOT NULL DEFAULT 'PENDENTE',
    "chaveGeracao" TEXT,
    "gatewayProvedor" TEXT,
    "gatewayCobrancaId" TEXT,
    "pixCopiaECola" TEXT,
    "linkPagamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cobrancaId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "valorPago" INTEGER NOT NULL,
    "valorPrincipal" INTEGER NOT NULL,
    "multa" INTEGER NOT NULL DEFAULT 0,
    "juros" INTEGER NOT NULL DEFAULT 0,
    "forma" "FormaPagamento" NOT NULL,
    "observacao" TEXT,
    "numeroRecibo" INTEGER NOT NULL,
    "origem" "OrigemPagamento" NOT NULL DEFAULT 'MANUAL',
    "registradoPorId" TEXT,
    "estornadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesa" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apartamentoId" TEXT,
    "categoria" "CategoriaDespesa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "observacao" TEXT,
    "ordemServicoId" TEXT,
    "removidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "despesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cobranca_chaveGeracao_key" ON "cobranca"("chaveGeracao");

-- CreateIndex
CREATE INDEX "cobranca_organizationId_competencia_idx" ON "cobranca"("organizationId", "competencia");

-- CreateIndex
CREATE INDEX "cobranca_organizationId_status_vencimento_idx" ON "cobranca"("organizationId", "status", "vencimento");

-- CreateIndex
CREATE INDEX "cobranca_contratoId_idx" ON "cobranca"("contratoId");

-- CreateIndex
CREATE INDEX "pagamento_cobrancaId_idx" ON "pagamento"("cobrancaId");

-- CreateIndex
CREATE INDEX "pagamento_organizationId_data_idx" ON "pagamento"("organizationId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_organizationId_numeroRecibo_key" ON "pagamento"("organizationId", "numeroRecibo");

-- CreateIndex
CREATE UNIQUE INDEX "despesa_ordemServicoId_key" ON "despesa"("ordemServicoId");

-- CreateIndex
CREATE INDEX "despesa_organizationId_data_idx" ON "despesa"("organizationId", "data");

-- CreateIndex
CREATE INDEX "arquivo_pagamentoId_idx" ON "arquivo"("pagamentoId");

-- CreateIndex
CREATE INDEX "arquivo_despesaId_idx" ON "arquivo"("despesaId");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "despesa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobranca" ADD CONSTRAINT "cobranca_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "cobranca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

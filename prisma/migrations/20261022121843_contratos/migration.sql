-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "IndiceReajuste" AS ENUM ('IGPM', 'IPCA', 'FIXO', 'NENHUM');

-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "contratoId" TEXT;

-- CreateTable
CREATE TABLE "contrato" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apartamentoId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "fiadorId" TEXT,
    "dataInicio" DATE NOT NULL,
    "dataFim" DATE NOT NULL,
    "valorAluguel" INTEGER NOT NULL,
    "valorInicial" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "valorCaucao" INTEGER,
    "caucaoDevolvidaEm" DATE,
    "valorCaucaoDevolvido" INTEGER,
    "indiceReajuste" "IndiceReajuste" NOT NULL DEFAULT 'IGPM',
    "percentualFixo" DECIMAL(6,3),
    "proximoReajusteEm" DATE,
    "multaPercentual" DECIMAL(5,2),
    "jurosMensalPercentual" DECIMAL(5,2),
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "encerradoEm" DATE,
    "motivoEncerramento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reajuste" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contratoId" TEXT NOT NULL,
    "dataBase" DATE NOT NULL,
    "indice" "IndiceReajuste" NOT NULL,
    "percentual" DECIMAL(8,4) NOT NULL,
    "valorAnterior" INTEGER NOT NULL,
    "valorNovo" INTEGER NOT NULL,
    "observacao" TEXT,
    "aplicadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indice_economico" (
    "id" TEXT NOT NULL,
    "indice" "IndiceReajuste" NOT NULL,
    "competencia" DATE NOT NULL,
    "variacao" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indice_economico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contrato_organizationId_status_idx" ON "contrato"("organizationId", "status");

-- CreateIndex
CREATE INDEX "contrato_apartamentoId_idx" ON "contrato"("apartamentoId");

-- CreateIndex
CREATE INDEX "contrato_inquilinoId_idx" ON "contrato"("inquilinoId");

-- CreateIndex
CREATE INDEX "reajuste_contratoId_dataBase_idx" ON "reajuste"("contratoId", "dataBase");

-- CreateIndex
CREATE UNIQUE INDEX "indice_economico_indice_competencia_key" ON "indice_economico"("indice", "competencia");

-- CreateIndex
CREATE INDEX "arquivo_contratoId_idx" ON "arquivo"("contratoId");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "inquilino"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_fiadorId_fkey" FOREIGN KEY ("fiadorId") REFERENCES "fiador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reajuste" ADD CONSTRAINT "reajuste_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reajuste" ADD CONSTRAINT "reajuste_aplicadoPorId_fkey" FOREIGN KEY ("aplicadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

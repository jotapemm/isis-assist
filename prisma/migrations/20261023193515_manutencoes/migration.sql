-- CreateEnum
CREATE TYPE "PrioridadeOS" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "ordemServicoId" TEXT;

-- AlterTable
ALTER TABLE "configuracao" ADD COLUMN     "proximoNumeroOS" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "prestador" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "documento" TEXT,
    "chavePix" TEXT,
    "observacoes" TEXT,
    "arquivadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_servico" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "apartamentoId" TEXT,
    "prestadorId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" "PrioridadeOS" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusOS" NOT NULL DEFAULT 'ABERTA',
    "custoEstimado" INTEGER,
    "custoFinal" INTEGER,
    "abertaEm" DATE NOT NULL,
    "concluidaEm" DATE,
    "solucao" TEXT,
    "statusAnteriorApto" "StatusApartamento",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prestador_organizationId_idx" ON "prestador"("organizationId");

-- CreateIndex
CREATE INDEX "ordem_servico_organizationId_status_idx" ON "ordem_servico"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ordem_servico_apartamentoId_idx" ON "ordem_servico"("apartamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "ordem_servico_organizationId_numero_key" ON "ordem_servico"("organizationId", "numero");

-- CreateIndex
CREATE INDEX "arquivo_ordemServicoId_idx" ON "arquivo"("ordemServicoId");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordem_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesa" ADD CONSTRAINT "despesa_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "ordem_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestador" ADD CONSTRAINT "prestador_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_servico" ADD CONSTRAINT "ordem_servico_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "prestador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

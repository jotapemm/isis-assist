-- CreateEnum
CREATE TYPE "RecorrenciaLembrete" AS ENUM ('NENHUMA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateTable
CREATE TABLE "lembrete" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apartamentoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" DATE,
    "hora" TEXT,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "recorrencia" "RecorrenciaLembrete" NOT NULL DEFAULT 'NENHUMA',
    "diaRecorrencia" INTEGER,
    "concluidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lembrete_organizationId_concluidoEm_data_idx" ON "lembrete"("organizationId", "concluidoEm", "data");

-- CreateIndex
CREATE INDEX "lembrete_apartamentoId_idx" ON "lembrete"("apartamentoId");

-- AddForeignKey
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembrete" ADD CONSTRAINT "lembrete_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

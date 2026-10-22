-- CreateEnum
CREATE TYPE "StatusApartamento" AS ENUM ('LIVRE', 'OCUPADO', 'RESERVADO', 'REFORMA', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "OrigemStatus" AS ENUM ('MANUAL', 'CONTRATO', 'MANUTENCAO', 'LEMBRETE', 'IMPORTACAO');

-- CreateEnum
CREATE TYPE "CategoriaArquivo" AS ENUM ('FOTO_APTO', 'DOCUMENTO', 'CONTRATO_PDF', 'COMPROVANTE', 'FOTO_OS');

-- CreateTable
CREATE TABLE "apartamento" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "andar" INTEGER,
    "bloco" TEXT,
    "descricao" TEXT,
    "quartos" INTEGER,
    "areaM2" INTEGER,
    "valorReferencia" INTEGER,
    "status" "StatusApartamento" NOT NULL DEFAULT 'LIVRE',
    "observacoes" TEXT,
    "arquivadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apartamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_status" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apartamentoId" TEXT NOT NULL,
    "de" "StatusApartamento",
    "para" "StatusApartamento" NOT NULL,
    "motivo" TEXT,
    "origem" "OrigemStatus" NOT NULL DEFAULT 'MANUAL',
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquilino" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "dataNascimento" DATE,
    "telefone" TEXT,
    "email" TEXT,
    "profissao" TEXT,
    "rendaMensal" INTEGER,
    "contatoEmergenciaNome" TEXT,
    "contatoEmergenciaTelefone" TEXT,
    "contatoEmergenciaParentesco" TEXT,
    "observacoes" TEXT,
    "aceitaWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" TEXT,
    "gatewayClienteId" TEXT,
    "arquivadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquilino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiador" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inquilinoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivo" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "categoria" "CategoriaArquivo" NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "apartamentoId" TEXT,
    "inquilinoId" TEXT,
    "enviadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apartamento_organizationId_idx" ON "apartamento"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "apartamento_propriedadeId_identificacao_key" ON "apartamento"("propriedadeId", "identificacao");

-- CreateIndex
CREATE INDEX "historico_status_apartamentoId_createdAt_idx" ON "historico_status"("apartamentoId", "createdAt");

-- CreateIndex
CREATE INDEX "historico_status_organizationId_idx" ON "historico_status"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "inquilino_usuarioId_key" ON "inquilino"("usuarioId");

-- CreateIndex
CREATE INDEX "inquilino_organizationId_idx" ON "inquilino"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "inquilino_organizationId_cpf_key" ON "inquilino"("organizationId", "cpf");

-- CreateIndex
CREATE INDEX "fiador_inquilinoId_idx" ON "fiador"("inquilinoId");

-- CreateIndex
CREATE UNIQUE INDEX "arquivo_chave_key" ON "arquivo"("chave");

-- CreateIndex
CREATE INDEX "arquivo_organizationId_idx" ON "arquivo"("organizationId");

-- CreateIndex
CREATE INDEX "arquivo_apartamentoId_idx" ON "arquivo"("apartamentoId");

-- CreateIndex
CREATE INDEX "arquivo_inquilinoId_idx" ON "arquivo"("inquilinoId");

-- AddForeignKey
ALTER TABLE "apartamento" ADD CONSTRAINT "apartamento_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartamento" ADD CONSTRAINT "apartamento_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquilino" ADD CONSTRAINT "inquilino_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiador" ADD CONSTRAINT "fiador_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "inquilino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "apartamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_inquilinoId_fkey" FOREIGN KEY ("inquilinoId") REFERENCES "inquilino"("id") ON DELETE CASCADE ON UPDATE CASCADE;

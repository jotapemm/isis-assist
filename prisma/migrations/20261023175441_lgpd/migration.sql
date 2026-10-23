-- AlterTable
ALTER TABLE "inquilino" ADD COLUMN     "dadosApagadosEm" TIMESTAMP(3),
ADD COLUMN     "guardarNomeAte" DATE,
ALTER COLUMN "aceitaWhatsapp" SET DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "termosAceitosEm" TIMESTAMP(3),
ADD COLUMN     "termosVersao" TEXT;

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

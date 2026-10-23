-- CreateEnum
CREATE TYPE "TipoPropriedade" AS ENUM ('EDIFICIO', 'CASAS');

-- AlterTable
ALTER TABLE "propriedade" ADD COLUMN     "tipo" "TipoPropriedade" NOT NULL DEFAULT 'EDIFICIO';

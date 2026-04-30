/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'OWNER', 'STAFF', 'SUPERADMIN');

-- AlterTable
ALTER TABLE "Slip" ADD COLUMN     "shopId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shopId" INTEGER,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bank" TEXT,
    "accountNo" TEXT,
    "accountName" TEXT,
    "logo" TEXT,
    "inviteCode" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_inviteCode_key" ON "Shop"("inviteCode");

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

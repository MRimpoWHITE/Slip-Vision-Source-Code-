-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "planExpiredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Slip" ADD COLUMN     "updatedById" INTEGER,
ADD COLUMN     "uploadedById" INTEGER;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" INTEGER NOT NULL,
    "shopId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_shopId_idx" ON "AuditLog"("shopId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Slip_shopId_createdAt_idx" ON "Slip"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Slip_refNo_idx" ON "Slip"("refNo");

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slip" ADD CONSTRAINT "Slip_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

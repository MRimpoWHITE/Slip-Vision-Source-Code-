-- CreateTable
CREATE TABLE "Slip" (
    "id" SERIAL NOT NULL,
    "sender" TEXT,
    "receiver" TEXT,
    "bank" TEXT,
    "amount" DOUBLE PRECISION,
    "date" TEXT,
    "time" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Slip_pkey" PRIMARY KEY ("id")
);

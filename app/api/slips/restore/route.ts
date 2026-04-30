// app/api/slips/restore/route.ts
// POST /api/slips/restore — restore a deleted slip from AuditLog details
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { auditLogId } = await req.json();
    if (!auditLogId) return NextResponse.json({ error: "auditLogId required" }, { status: 400 });

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { shopId: true, role: true },
    });

    if (!user?.shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    const log = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!log || log.shopId !== user.shopId || log.action !== "DELETE") {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = log.details as any;

    await prisma.$transaction(async (tx) => {
      const restored = await tx.slip.create({
        data: {
          shopId: user.shopId!,
          bank: d.bank ?? null,
          date: d.date ?? null,
          time: d.time ?? null,
          amount: d.amount ?? 0,
          sender: d.sender ?? null,
          receiver: d.receiver ?? null,
          refNo: d.refNo ?? null,
          imageUrl: d.imageUrl ?? null,
          details: d.details ?? null,
          verified: d.verified ?? false,
          uploadedById: d.uploadedById ?? userId,
        },
      });

      // Remove the delete log and add a restore audit entry
      await tx.auditLog.delete({ where: { id: auditLogId } });
      await tx.auditLog.create({
        data: {
          shopId: user.shopId!,
          actorId: userId,
          action: "UPLOAD",
          targetType: "SLIP",
          targetId: String(restored.id),
          details: { restoredFrom: auditLogId },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}

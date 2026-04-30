// app/api/shop/deleted-logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { del } from "@vercel/blob";

const RETENTION_DAYS = 7;

// Auto-purge deleted-log entries older than RETENTION_DAYS and remove their blob images
async function purgeExpiredLogs(shopId: number) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const expired = await prisma.auditLog.findMany({
    where: {
      shopId,
      action: "DELETE",
      createdAt: { lt: cutoff },
    },
    select: { id: true, details: true },
  });

  if (expired.length === 0) return;

  // Collect blob URLs from stored slip details
  const blobUrls: string[] = expired
    .map((log) => (log.details as any)?.imageUrl)
    .filter((url): url is string => typeof url === "string" && url.startsWith("http"));

  // Delete blobs and AuditLog entries in parallel
  await Promise.all([
    ...blobUrls.map((url) => del(url).catch(() => {})), // ignore individual blob errors
    prisma.auditLog.deleteMany({
      where: { id: { in: expired.map((l) => l.id) } },
    }),
  ]);

  console.log(`[deleted-logs] Purged ${expired.length} expired log(s), ${blobUrls.length} blob(s) deleted`);
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { shopId: true, role: true },
    });

    if (!user?.shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const logs = await prisma.auditLog.findMany({
      where: { shopId: user.shopId, action: "DELETE" },
      select: { id: true, details: true },
    });

    const blobUrls: string[] = logs
      .map((log) => (log.details as any)?.imageUrl)
      .filter((url): url is string => typeof url === "string" && url.startsWith("http"));

    await Promise.all([
      ...blobUrls.map((url) => del(url).catch(() => {})),
      prisma.auditLog.deleteMany({
        where: { shopId: user.shopId!, action: "DELETE" },
      }),
    ]);

    return NextResponse.json({ success: true, deleted: logs.length });
  } catch (error) {
    console.error("Error clearing deleted logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { shopId: true, role: true },
    });

    if (!user || !user.shopId) {
      return NextResponse.json({ error: "Shop not found" }, { status: 400 });
    }

    if (user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only Owner can view this." }, { status: 403 });
    }

    // Run cleanup every time the page loads
    await purgeExpiredLogs(user.shopId);

    const logs = await prisma.auditLog.findMany({
      where: { shopId: user.shopId, action: "DELETE" },
      include: {
        actor: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);

  } catch (error) {
    console.error("Error fetching deleted logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
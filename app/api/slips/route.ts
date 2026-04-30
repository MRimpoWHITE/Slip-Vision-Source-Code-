// app/api/slips/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([], { status: 401 });

  // หา User เพื่อเอา shopId
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true }
  });

  if (!user?.shopId) return NextResponse.json({ slips: [], total: 0, page: 1, totalPages: 0 });

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || 1));
  const skip = (page - 1) * PAGE_SIZE;

  // ดึงพร้อมกัน: สลิป + จำนวนทั้งหมด
  const [slips, total] = await prisma.$transaction([
    prisma.slip.findMany({
      where: { shopId: user.shopId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        uploadedBy: { select: { name: true, username: true } },
        updatedBy:  { select: { name: true, username: true } },
      },
    }),
    prisma.slip.count({ where: { shopId: user.shopId } }),
  ]);

  return NextResponse.json({
    slips,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  }, {
    headers: {
      'Cache-Control': 'private, max-age=300', // 5 minutes
    }
  });
}

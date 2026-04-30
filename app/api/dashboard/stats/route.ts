// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. หา shopId ของ User
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true }
  });

  if (!user || !user.shopId) {
    // ถ้าไม่มีร้าน ให้คืนค่า 0 ทั้งหมด
    return NextResponse.json({
      totalSales: 0,
      totalSlips: 0,
      pendingSlips: 0,
      recentSlips: []
    });
  }

  // 2. ดึงข้อมูลโดยกรองด้วย shopId (สำคัญมาก!)
  const shopId = user.shopId;

  // 2.1 ยอดขายรวม
  const totalSalesAgg = await prisma.slip.aggregate({
    where: { shopId }, // ✅ กรองเฉพาะร้านนี้
    _sum: { amount: true }
  });

  // 2.2 จำนวนสลิปทั้งหมด
  const totalSlips = await prisma.slip.count({
    where: { shopId } // ✅ กรองเฉพาะร้านนี้
  });

  // 2.3 สลิปที่รอตรวจสอบ (สมมติว่าถ้าไม่มีรายละเอียด details หรืออะไรสักอย่างถือว่ารอ)
  // หรือถ้ามี field status ก็ใช้ status: 'pending' ได้เลย
  // ในที่นี้สมมติว่านับหมดไปก่อน หรือลูกพี่ใส่เงื่อนไขเพิ่มได้
  const pendingSlips = 0; // (รอ logic เพิ่มเติม)

  // 2.4 รายการล่าสุด 5 รายการ
  const recentSlips = await prisma.slip.findMany({
    where: { shopId }, // ✅ กรองเฉพาะร้านนี้
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return NextResponse.json({
    totalSales: totalSalesAgg._sum.amount || 0,
    totalSlips,
    pendingSlips,
    recentSlips
  }, {
    headers: {
      'Cache-Control': 'private, max-age=60', // 1 minute
    }
  });
}
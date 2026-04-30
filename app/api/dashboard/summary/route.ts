// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([], { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true }
  });

  if (!user || !user.shopId) return NextResponse.json({ salesByBank: [], dailySales: [] });

  const shopId = user.shopId;

  // 1. สรุปยอดตามธนาคาร (Pie Chart)
  const salesByBank = await prisma.slip.groupBy({
    by: ['bank'],
    where: { shopId }, // ✅ กรองเฉพาะร้านนี้
    _sum: { amount: true },
    _count: { id: true }
  });

  // 2. สรุปยอดขาย 7 วันล่าสุด (Bar Chart)
  // (Prisma ไม่มี GroupBy Date แบบตรงๆ ในบาง DB อาจต้องดึง Raw หรือดึงมาคำนวณ JS)
  // เอาแบบง่าย: ดึงข้อมูล 7 วันล่าสุดมาคำนวณใน JS
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const rawSlips = await prisma.slip.findMany({
    where: { 
      shopId, // ✅ กรองเฉพาะร้านนี้
      createdAt: { gte: sevenDaysAgo }
    },
    select: { createdAt: true, amount: true }
  });

  // จัดกลุ่มตามวันที่ (DD/MM/YYYY)
  const dailySalesMap = new Map<string, number>();
  
  rawSlips.forEach(slip => {
    const dateKey = new Date(slip.createdAt).toLocaleDateString('th-TH');
    const current = dailySalesMap.get(dateKey) || 0;
    dailySalesMap.set(dateKey, current + (slip.amount ?? 0));
  });

  // แปลงเป็น Array สวยๆ ส่งกลับไป
  const dailySales = Array.from(dailySalesMap.entries()).map(([date, amount]) => ({
    date,
    amount
  }));

  return NextResponse.json({
    salesByBank, // ส่งกลับไปให้กราฟวงกลม
    dailySales   // ส่งกลับไปให้กราฟแท่ง
  }, {
    headers: {
      'Cache-Control': 'private, max-age=60', // 1 minute
    }
  });
}
// app/api/shop/join/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { inviteCode } = await req.json();

    // 1. ค้นหาร้านจาก Code
    const shop = await prisma.shop.findUnique({
      where: { inviteCode }
    });

    if (!shop) {
      return NextResponse.json({ error: "รหัสร้านค้าไม่ถูกต้อง" }, { status: 404 });
    }

    // 2. อัปเดต User เข้าไปเป็น STAFF
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        shopId: shop.id,
        role: "STAFF" // เป็นพนักงาน
      }
    });

    return NextResponse.json({ success: true, shopName: shop.name });

  } catch (error) {
    console.error("Join Shop Error:", error);
    return NextResponse.json({ error: "เข้าร่วมร้านค้าไม่สำเร็จ" }, { status: 500 });
  }
}
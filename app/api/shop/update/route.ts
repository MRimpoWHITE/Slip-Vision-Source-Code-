// app/api/shop/update/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  
  // 1. เช็คว่าล็อกอินยัง
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, accountNo } = await req.json();

    // 2. เช็คว่าเป็น Owner ไหม
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { shopId: true, role: true }
    });

    if (user?.role !== "OWNER" || !user.shopId) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 3. อัปเดตข้อมูลร้าน
    const updatedShop = await prisma.shop.update({
      where: { id: user.shopId },
      data: {
        name,
        accountNo
      }
    });

    return NextResponse.json({ success: true, shop: updatedShop });

  } catch (error) {
    console.error("Update Shop Error:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}
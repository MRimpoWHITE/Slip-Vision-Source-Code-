import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";


export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.user.id);

    // 🛡️ เช็คก่อนว่าเป็นเจ้าของร้านไหม (ถ้าเป็นเจ้าของ ห้ามกดออก ต้องไปกดลบ)
    // เช็คจาก DB ชัวร์สุด
    const ownedShop = await prisma.shop.findFirst({
        where: { ownerId: userId }
    });

    if (ownedShop) {
        return NextResponse.json({ error: "เจ้าของร้านไม่สามารถลาออกได้ (ต้องใช้เมนูลบร้านค้าเท่านั้น)" }, { status: 400 });
    }

    // ✅ ปลดตัวเองออกจากร้าน (Set shopId = null)
    await prisma.user.update({
      where: { id: userId },
      data: { shopId: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Leave Shop Error:", error);
    return NextResponse.json({ error: "Failed to leave shop" }, { status: 500 });
  }
}
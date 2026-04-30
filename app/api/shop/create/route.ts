// app/api/shop/create/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createShopSchema } from "@/lib/validations";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 1. ตรวจสอบข้อมูลด้วย Zod
    const validation = createShopSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, bank, accountNo, accountName, plan } = validation.data;

    // 1. หา User ปัจจุบัน
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.shopId) return NextResponse.json({ error: "คุณมีสังกัดร้านค้าแล้ว" }, { status: 400 });

    // 2. สุ่มรหัส Invite Code (เช่น SV-4829)
    const inviteCode = `SV-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. สร้างร้านค้า + อัปเดต User เป็น OWNER ทันที (Transaction)
    // ใช้ Transaction เพื่อให้มั่นใจว่าทำทั้งคู่สำเร็จ หรือล้มเหลวทั้งคู่
    const result = await prisma.$transaction(async (tx) => {
      // สร้างร้าน
      const newShop = await tx.shop.create({
        data: {
          name,
          bank,
          accountNo,
          accountName,
          plan,
          planExpiredAt: plan === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          inviteCode,
          ownerId: user.id,
        }
      });

      // อัปเดต User
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          shopId: newShop.id,
          role: "OWNER" 
        }
      });

      return { shop: newShop, user: updatedUser };
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("Create Shop Error:", error);
    return NextResponse.json({ error: "สร้างร้านค้าไม่สำเร็จ" }, { status: 500 });
  }
}
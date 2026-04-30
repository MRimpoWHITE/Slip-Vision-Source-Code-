import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";


export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = Number(session.user.id);

    // 🔥 แก้จุดตาย: ค้นหาร้านจาก Database โดยตรง (โดยใช้ userId ของเราเป็นคนหา)
    // ไม่ต้องง้อ session.shopId ที่อาจจะไม่อัปเดต
    const shop = await prisma.shop.findFirst({
        where: { ownerId: userId }
    });

    // ถ้าหาไม่เจอ แสดงว่าไม่ได้เป็นเจ้าของร้านไหนเลย
    if (!shop) {
        return NextResponse.json({ error: "ไม่พบร้านค้าที่คุณเป็นเจ้าของ (หรือคุณอาจลบไปแล้ว)" }, { status: 404 });
    }

    const shopId = shop.id;

    // รวบรวม blob URLs จากสลิปทั้งหมดก่อนลบ
    const slips = await prisma.slip.findMany({
        where: { shopId },
        select: { imageUrl: true },
    });
    const blobUrls = slips
        .map(s => s.imageUrl)
        .filter((url): url is string => typeof url === "string" && url.startsWith("http"));

    // ลบ blob ทั้งหมด (parallel, ignore individual errors)
    await Promise.all(blobUrls.map(url => del(url).catch(() => {})));

    // ลบข้อมูลใน DB
    await prisma.$transaction([
        prisma.auditLog.deleteMany({ where: { shopId } }),
        prisma.slip.deleteMany({ where: { shopId } }),
        prisma.user.updateMany({ where: { shopId }, data: { shopId: null } }),
        prisma.shop.delete({ where: { id: shopId } }),
        prisma.user.update({ where: { id: userId }, data: { role: "USER" } }),
    ]);

    await prisma.user.update({
        where: { id: userId },
        data: { shopId: null },
    });

    

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete Shop Error:", error);
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
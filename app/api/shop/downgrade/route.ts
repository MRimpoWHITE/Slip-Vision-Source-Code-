import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, shopId: true },
  });

  if (!user?.shopId)
    return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้น" }, { status: 403 });

  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { ownerId: true, plan: true },
  });

  if (!shop || shop.ownerId !== user.id)
    return NextResponse.json({ error: "คุณไม่ใช่เจ้าของร้านนี้" }, { status: 403 });
  if (shop.plan === "free")
    return NextResponse.json({ error: "ร้านนี้ใช้แผน Free อยู่แล้ว" }, { status: 400 });

  const updated = await prisma.shop.update({
    where: { id: user.shopId },
    data: { plan: "free", planExpiredAt: null },
    select: { id: true, name: true, plan: true, planExpiredAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}

// app/api/shop/upgrade/route.ts
// PATCH /api/shop/upgrade — upgrade the current user's shop plan to premium
// Only the shop OWNER is allowed to call this endpoint.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, shopId: true },
  });

  if (!user || !user.shopId) {
    return NextResponse.json({ error: "ไม่พบร้านค้า" }, { status: 404 });
  }

  if (user.role !== "OWNER") {
    return NextResponse.json({ error: "เฉพาะเจ้าของร้านเท่านั้นที่สามารถ upgrade ได้" }, { status: 403 });
  }

  // Verify the user is actually the owner of the shop (not just role=OWNER from a previous shop)
  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { ownerId: true, plan: true },
  });

  if (!shop || shop.ownerId !== user.id) {
    return NextResponse.json({ error: "คุณไม่ใช่เจ้าของร้านนี้" }, { status: 403 });
  }

  // Set plan to premium and extend/set expiry to 30 days from now
  const planExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const updatedShop = await prisma.shop.update({
    where: { id: user.shopId },
    data: {
      plan: "premium",
      planExpiredAt,
    },
    select: { id: true, name: true, plan: true, planExpiredAt: true },
  });

  return NextResponse.json({ success: true, data: updatedShop });
}

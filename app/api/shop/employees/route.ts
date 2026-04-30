// app/api/shop/employees/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";


// GET: ดึงรายชื่อพนักงานทั้งหมดในร้าน
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. หาว่าคนเรียกคือใคร และอยู่ร้านไหน
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true, role: true }
  });

  // 2. ถ้าไม่ใช่ Owner หรือไม่มีร้าน -> ห้ามดู
  if (!user || user.role !== "OWNER" || !user.shopId) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // 3. ดึงพนักงานทุกคนที่มี shopId เดียวกัน (ยกเว้นตัวเอง)
  const employees = await prisma.user.findMany({
    where: {
      shopId: user.shopId,
      role: "STAFF" // เอาเฉพาะพนักงาน
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ employees }, {
    headers: {
      'Cache-Control': 'private, max-age=60', // 1 minute
    }
  });
}

// DELETE: ไล่พนักงานออก
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json(); // รับ ID พนักงานที่จะลบ

    // เช็คสิทธิ์ Owner เหมือนเดิม
    const owner = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { shopId: true, role: true }
    });

    if (owner?.role !== "OWNER") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // ลบ shopId ออกจาก User คนนั้น (ไม่ได้ลบ User ทิ้ง แค่เตะออกจากร้าน)
    await prisma.user.update({
      where: { id: id },
      data: { shopId: null, role: "USER" } // ปรับ Role กลับเป็น User ธรรมดา
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to remove employee" }, { status: 500 });
  }
}
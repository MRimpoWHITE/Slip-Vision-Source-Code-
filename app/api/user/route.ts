import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

// 1. ดึงข้อมูล User (GET) - เหมือนเดิม
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      phone: true,
      gender: true,
      birthDate: true,
      role: true,
      image: true,
      shopId: true,
      shop: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          ownerId: true,
          plan: true,
          planExpiredAt: true,
        }
      }
    }
  });

  return NextResponse.json(user);
}

// 2. อัปเดตข้อมูล User (PATCH) - เพิ่มการเช็ครหัสผ่านเดิม
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, gender, birthDate, currentPassword, newPassword } = body;

  // 🛡️ ค้นหา User เพื่อเอารหัสผ่านเดิมมาเทียบ
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
  }

  // 🛡️ ยืนยันรหัสผ่านเดิมก่อนแก้ไข
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 401 });
  }

  const updateData: Prisma.UserUpdateInput = {
    name,
    phone,
    gender,
    birthDate: birthDate ? new Date(birthDate) : null,
  };

  if (newPassword && newPassword.trim() !== "") {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 3. ลบบัญชีผู้ใช้ (DELETE) - เพิ่มการเช็ครหัสผ่านก่อนล้างบาง
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🛡️ รับ Password จาก Body
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "กรุณาระบุรหัสผ่านเพื่อยืนยัน" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, shopId: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🛡️ ตรวจสอบรหัสผ่านก่อนลบถาวร
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง การลบบัญชีถูกยกเลิก" }, { status: 401 });
    }

    const userId = user.id;

    await prisma.$transaction(async (tx) => {
      // 1. ลบ Audit Log ที่เกี่ยวข้องกับคนนี้
      await tx.auditLog.deleteMany({ where: { actorId: userId } });

      // 2. Set null ใน Slip เพื่อรักษาประวัติสลิป (หรือจะลบก็ได้ตามใจ Phu)
      await tx.slip.updateMany({
        where: { uploadedById: userId },
        data: { uploadedById: null }
      });
      await tx.slip.updateMany({
        where: { updatedById: userId },
        data: { updatedById: null }
      });

      // 3. กรณีเป็นเจ้าของร้าน (OWNER) -> ล้างบางร้านค้า
      if (user.role === "OWNER" && user.shopId) {
        await tx.auditLog.deleteMany({ where: { shopId: user.shopId } });
        await tx.slip.deleteMany({ where: { shopId: user.shopId } });
        await tx.user.updateMany({
          where: { shopId: user.shopId },
          data: { shopId: null, role: "USER" }
        });
        await tx.shop.delete({ where: { id: user.shopId } });
      }

      // 4. ลบตัว User
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ success: true, message: "Account deleted successfully" });

  } catch (error) {
    console.error("Delete Account Error:", error);
    return NextResponse.json({ error: "ลบบัญชีไม่สำเร็จ: " + (error as Error).message }, { status: 500 });
  }
}
// app/api/slips/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { updateSlipSchema } from "@/lib/validations";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slipId = Number(id);
    const body = await request.json();

    // 0. ตรวจสอบข้อมูลด้วย Zod
    const validation = updateSlipSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const validatedData = validation.data;

    // 1. เช็คสิทธิ์คนแก้
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const userShopId = Number(session.user.shopId);

    // 2. ดึงข้อมูลเก่ามาก่อน (เอาไว้เทียบ หรือเก็บ Backup)
    const oldSlip = await prisma.slip.findUnique({
      where: { id: slipId }
    });

    if (!oldSlip) return NextResponse.json({ error: "Slip not found" }, { status: 404 });
    if (oldSlip.shopId !== userShopId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 3. ทำรายการอัปเดต + บันทึก Log (Transaction)
    const [updatedSlip, log] = await prisma.$transaction([
      // 3.1 อัปเดตสลิป
      prisma.slip.update({
        where: { id: slipId },
        data: {
          ...validatedData, // ใช้ข้อมูลที่ผ่านการ Validate แล้ว
          updatedById: userId
        },
      }),

      // 3.2 สร้าง Audit Log "UPDATE"
      prisma.auditLog.create({
        data: {
          shopId: userShopId,
          actorId: userId,
          action: "UPDATE",
          targetType: "SLIP",
          targetId: String(slipId),
          details: {
            // เก็บความเปลี่ยนแปลง (แบบง่ายๆ คือเก็บค่าเก่าไว้ดูเทียบ)
            previous_data: {
              amount: oldSlip.amount,
              bank: oldSlip.bank,
              date: oldSlip.date,
              time: oldSlip.time,
              details: oldSlip.details
            },
            new_data: validatedData // เก็บค่าใหม่ที่ Validate แล้ว
          }
        }
      })
    ]);


    return NextResponse.json(updatedSlip);

  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 🔥 ฟังก์ชันลบข้อมูล (DELETE) - ร่างใหม่ไฉไลกว่าเดิม!
// app/api/slips/[id]/route.ts (ส่วน DELETE)

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const slipId = Number(id);

    // 1. 🔐 เช็คว่าใครเป็นคนลบ?
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 🔎 ดึงข้อมูลสลิป
    const slip = await prisma.slip.findUnique({
      where: { id: slipId },
    });

    if (!slip) {
      return NextResponse.json({ error: "Slip not found" }, { status: 404 });
    }

    // 3. 🛡️ เช็คสิทธิ์ (แก้ตรงนี้) 👇
    const userId = Number(session.user.id);

    const actor = await prisma.user.findUnique({
        where: { id: userId } 
    });

    // ถ้าหา User ไม่เจอ หรืออยู่คนละร้าน
    if (!actor || actor.shopId !== slip.shopId) {
       return NextResponse.json({ error: "Forbidden: คนละร้านห้ามยุ่ง" }, { status: 403 });
    }

    // 4. 🚀 Transaction: สร้าง Log + ลบ
    await prisma.$transaction([
      prisma.auditLog.create({
        data: {
          shopId: slip.shopId!, 
          actorId: actor.id,
          action: "DELETE",       
          targetType: "SLIP",
          targetId: String(slip.id),
          details: { ...slip },
        }
      }),
      
      prisma.slip.delete({
        where: { id: slipId },
      }),
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. ตรวจสอบข้อมูลด้วย Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      // ดึง Error Message ตัวแรกมาแสดง
      const firstError = validation.error.issues[0].message;
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { username, email, password, name, phone, gender, birthDate } = validation.data;

    // 2. เช็คว่ามี User นี้อยู่แล้วหรือยัง
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 });
    }

    // 3. เข้ารหัสรหัสผ่าน (Hash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. สร้าง User ใหม่
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        phone,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null, // แปลง String เป็น Date
      },
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, username: newUser.username } }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }, { status: 500 });
  }
}
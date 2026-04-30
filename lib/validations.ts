import { z } from "zod";

// 1. กฎการสมัครสมาชิก (Register)
export const registerSchema = z.object({
  username: z.string().min(3, "Username ต้องมีอย่างน้อย 3 ตัวอักษร").max(20),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "Password ต้องมีอย่างน้อย 6 ตัวอักษร"),
  name: z.string().min(2, "กรุณากรอกชื่อจริง").optional().or(z.literal("")),
  phone: z.string().min(10, "เบอร์โทรศัพท์ต้องมี 10 หลัก").max(10).optional().or(z.literal("")),
  gender: z.string().min(1, "กรุณาระบุเพศ"),
  birthDate: z.string().min(1, "กรุณาระบุวันเดือนปีเกิด"), 
});

// 2. กฎการสร้างร้านค้า (Create Shop)
export const createShopSchema = z.object({
  name: z.string().min(3, "ชื่อร้านต้องมีอย่างน้อย 3 ตัวอักษร"),
  bank: z.string().min(2, "กรุณาระบุธนาคาร"),
  accountNo: z.string().min(10, "เลขบัญชีไม่ถูกต้อง").max(15),
  accountName: z.string().min(2, "กรุณาระบุชื่อบัญชี"),
  plan: z.enum(["free", "premium"]).default("free"),
});

// 3. กฎการแก้ไขสลิป (Update Slip)
export const updateSlipSchema = z.object({
  sender: z.string().optional().nullable(),
  receiver: z.string().optional().nullable(),
  amount: z.coerce.number().min(0, "ยอดเงินห้ามติดลบ"),
  bank: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  refNo: z.string().optional().nullable(),
});

# 👁️ SlipVision — ระบบจัดการสลิปอัจฉริยะด้วย AI

<div align="center">

**SlipVision** คือเว็บแอปพลิเคชันสำหรับ **บันทึก ตรวจสอบ และจัดการสลิปโอนเงินธนาคารอัตโนมัติ**  
ขับเคลื่อนด้วย [**Typhoon AI**](https://opentyphoon.ai/) สำหรับการอ่านข้อมูล (OCR) และ Parser  
พร้อมระบบแดชบอร์ดและสรุปยอดขายที่เข้าถึงได้จากทุกที่

<img width="1867" height="1039" alt="Screenshot 2026-05-01 023946" src="https://github.com/user-attachments/assets/6e77cf81-27e1-468d-841c-ff46f8877192" />

</div>

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| หมวด | เทคโนโลยี |
|------|-----------|
| **Framework** | Next.js 16+ (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL (via Prisma ORM v6) |
| **Authentication** | NextAuth.js (Credentials Provider) |
| **AI — OCR** | Typhoon OCR (`typhoon-ocr`) |
| **AI — Parser** | Typhoon LLM (`typhoon-v2.5-30b-a3b-instruct`) |
| **AI — QR Verify** | Thunder API (`api.thunder.in.th`) |
| **UI / Styling** | Tailwind CSS v4, Lucide React, Next-themes |
| **Charts** | Recharts |
| **File Storage** | Vercel Blob |
| **Image Processing** | Sharp, HEIC Converter, jsQR |
| **Excel Export** | xlsx |
| **Toast / Alerts** | react-hot-toast, AlertProvider (custom) |

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 🤖 AI Slip Processing
- **OCR + AI Parser** — อัปโหลดสลิปแล้วระบบอ่านค่าให้อัตโนมัติ (ธนาคาร, ยอดเงิน, วันที่, เวลา, ผู้โอน, ผู้รับ, Ref No.)
- **QR Code Verification (Premium)** — ถอดรหัส QR บนสลิปแล้วยืนยันกับ Thunder API เพื่อความแม่นยำสูงสุด
- **ตรวจสลิปซ้ำ** — เช็ค Ref No. ซ้ำอัตโนมัติ พร้อมแจ้งเตือนในโน้ต
- **ตรวจสลิปปลอม** — AI วิเคราะห์ว่ารูปที่อัปโหลดเป็นสลิปธนาคารจริงหรือเปล่า ถ้าไม่ใช่จะบันทึกพร้อมหมายเหตุ `[ไม่ใช่สลิปธนาคาร]`
- **รองรับ HEIC** — แปลงรูปจาก iPhone (HEIC) เป็น JPEG ก่อนประมวลผลอัตโนมัติ

### 📊 Dashboard & Analytics
- **ตารางสลิป** — ดูรายการสลิปทั้งหมด กรองตามวัน/เดือน และแก้ไขข้อมูลได้
- **สรุปยอดขาย** — กราฟ Line Chart (แนวโน้มยอดเงิน) และ Pie Chart (สัดส่วนตามธนาคาร)
- **Export Excel** — เลือกช่วงวันที่อัปโหลดแล้วดาวน์โหลดเป็น `.xlsx` ได้ทันที
- **ถังขยะสลิป** — รายการสลิปที่ถูกลบ ยังกู้คืนได้ หรือลบถาวรทั้งหมดพร้อมล้างรูปจาก Cloud

### 👥 ระบบร้านค้าและผู้ใช้
- **Role-based Access Control**
  - **Owner** — สร้างร้าน, จัดการพนักงาน, ดู Audit Log, ลบสลิป, Export ข้อมูล
  - **Staff** — สแกนสลิป, ดูรายการในร้าน
- **Invite Code System** — เจ้าของร้านแชร์รหัสให้พนักงานเข้าร่วมร้านได้
- **Shop Plan** — Standard (ฟรี) และ Premium Vision (QR Verification)
- **Audit Log** — บันทึกทุก action ของผู้ใช้ (อัปโหลด, แก้ไข, ลบ, กู้คืน)

### 🔐 ความปลอดภัย
- **Secure Authentication** — ล็อกอินด้วย bcrypt Password Hashing
- **Session Guard** — ทุก API มีการตรวจสอบ session และ shopId ก่อนดำเนินการ
- **Rate Limiting** — จำกัดการสแกน 15 ครั้ง/นาที (Free Plan)
- **Server-side Validation** — ใช้ Zod schema validate ทั้ง frontend และ API

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### 1. สิ่งที่ต้องมีก่อน (Prerequisites)

- Node.js v18 ขึ้นไป
- PostgreSQL (ติดตั้งและสร้าง Database เปล่าไว้)
- API Key จาก [Typhoon AI](https://opentyphoon.ai/) (สำหรับ OCR + Parser)
- API Key จาก [Thunder](https://thunder.in.th/) *(เฉพาะ Premium Plan)*
- Vercel Blob Token *(สำหรับเก็บรูปสลิปบน Cloud)*

---

### 2. ติดตั้งไลบรารี (Installation)

Clone โปรเจกต์และติดตั้ง Dependencies:

```bash
git clone <your-repo-url>
cd slip-vision
npm install
```

ไลบรารีเฉพาะเจาะจงที่ใช้ในโปรเจกต์ (กรณีติดตั้งแยก):

```bash
# Core & Database
npm install prisma@6 @prisma/client@6

# AI & HTTP
npm install openai

# Authentication
npm install next-auth bcryptjs
npm install -D @types/bcryptjs

# UI & Icons
npm install lucide-react react-hot-toast next-themes

# Charts & Date
npm install recharts date-fns

# Image Processing
npm install heic-convert sharp jsqr

# Excel Export
npm install xlsx

# File Storage
npm install @vercel/blob
```

---

### 3. ตั้งค่า Environment Variables (.env)

สร้างไฟล์ `.env` ที่ root folder และกำหนดค่าดังนี้:

```env
# ─── Database ─────────────────────────────────────────────
# รูปแบบ: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
DATABASE_URL="postgresql://postgres:1234@localhost:5432/slip_vision?schema=public"

# ─── Typhoon AI (OCR + Parser) ────────────────────────────
TYPHOON_API_KEY="your_typhoon_api_key_here"
TYPHOON_BASE_URL="https://api.opentyphoon.ai/v1"

# ─── Thunder API (QR Verification - Premium Plan) ─────────
THUNDER_API_KEY="your_thunder_api_key_here"

# ─── Vercel Blob (Cloud Storage) ──────────────────────────
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token_here"

# ─── NextAuth ─────────────────────────────────────────────
# สร้าง Secret ด้วย: openssl rand -base64 32
# หรือ: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

### 4. ตั้งค่าฐานข้อมูล (Database Setup)

```bash
# ส่งโครงสร้าง Schema ไปยัง Database
npx prisma db push

# สร้าง Prisma Client
npx prisma generate
```

---

### 5. รันโปรเจกต์ (Run Development)

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ → [http://localhost:3000](http://localhost:3000)

---

### 6. ทดสอบผ่านวงแลน (Test on Mobile / LAN)

หากต้องการเปิดผ่านมือถือหรือเครื่องอื่นใน Wi-Fi เดียวกัน:

```bash
# เปลี่ยน IP เป็นหมายเลขของเครื่องคุณ (ดูได้จาก ipconfig)
npm run dev -- -H 192.168.1.64
```

---

## 🗄️ คำสั่ง Prisma ที่ควรรู้

```bash
npx prisma studio          # เปิด GUI ดูและแก้ไขข้อมูลใน DB
npx prisma db push         # อัปเดต Schema ล่าสุดไปยัง DB
npx prisma generate        # สร้าง Prisma Client ใหม่
npx prisma migrate reset   # ⚠️ ล้างฐานข้อมูลทั้งหมดและเริ่มใหม่
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
SlipVision/
├── app/
│   ├── api/
│   │   ├── scan/          # AI OCR + Parser + QR Verify
│   │   ├── slips/         # CRUD สลิป + Restore
│   │   ├── shop/          # จัดการร้าน, Invite, Deleted Logs
│   │   └── user/          # Profile, Auth, Delete Account
│   ├── dashboard/
│   │   ├── page.tsx       # หน้าแดชบอร์ดหลัก
│   │   ├── table/         # ตารางสลิปทั้งหมด + Export Excel
│   │   ├── summary/       # กราฟสรุปยอดขาย
│   │   ├── deleted-logs/  # ถังขยะสลิป
│   │   ├── employee-info/ # จัดการพนักงาน + Invite Code
│   │   └── settings/      # ตั้งค่าร้านค้า
│   ├── shopcreate/        # สร้างร้านค้าใหม่ (Wizard)
│   └── user-info/         # ข้อมูลโปรไฟล์ผู้ใช้
├── components/
│   ├── SummaryCharts.tsx  # Recharts กราฟ
│   ├── SlipUploadButton.tsx # Modal อัปโหลดสลิป
│   ├── DeletedLogsTable.tsx # ถังขยะ
│   ├── InviteCodeCard.tsx  # Card แสดง Invite Code
│   └── providers/
│       └── AlertProvider.tsx # Global Alert Modal
├── lib/
│   ├── prisma.ts
│   ├── rate-limit.ts
│   └── validations.ts     # Zod Schema
└── utils/
    └── resizeImage.ts     # Client-side Image Resize
```

---

## 🔄 Flow การทำงาน (Scan Pipeline)

```
[ผู้ใช้อัปโหลดรูป]
        │
        ▼
[Client: Resize รูป (max 1200px)]
        │
        ▼
[POST /api/scan]
        │
   ┌────┴────┐
   │         │
   ▼         ▼
[Vercel   [Typhoon OCR]   ← ทำงานพร้อมกัน
  Blob]        │
               ▼
         [LLM Parser]     ← ดึง bank, amount, date, refNo, is_slip
               │
        ┌──────┴──────┐
        │ is_slip?     │
       YES             NO
        │              │
        ▼              ▼
  [เช็คสลิปซ้ำ]  [บันทึก note:
  [Validation]    ไม่ใช่สลิป]
        │
        ▼
  [บันทึก DB + AuditLog]
```

> **Premium QR Mode:** แทนที่จะใช้ OCR → Parser, ระบบจะถอดรหัส QR จากรูป แล้วส่ง Payload ไปยืนยันกับ **Thunder API** โดยตรง เพื่อความแม่นยำสูงสุด

---

## ☁️ การ Deploy (Production)

วิธีที่ง่ายที่สุดคือใช้ **[Vercel](https://vercel.com/)** จากผู้สร้าง Next.js โดยตรง

1. Push โค้ดขึ้น GitHub
2. Import โปรเจกต์เข้า Vercel
3. ตั้งค่า Environment Variables ทุกตัวใน Vercel Dashboard
4. Deploy ได้เลย

---

## 📚 แหล่งเรียนรู้เพิ่มเติม

- [Next.js Documentation](https://nextjs.org/docs) — คู่มือการใช้งานฟีเจอร์และ API
- [Learn Next.js](https://nextjs.org/learn) — บทเรียนแบบ Interactive
- [Typhoon AI](https://opentyphoon.ai/) — AI ภาษาไทยที่ใช้สำหรับ OCR และ Parse
- [Thunder API](https://thunder.in.th/) — API สำหรับยืนยันสลิปธนาคารไทย
- [Prisma Docs](https://www.prisma.io/docs) — ORM สำหรับจัดการฐานข้อมูล
- [Recharts](https://recharts.org/) — Library กราฟสำหรับ React

---

## 👥 ผู้จัดทำ

**RMUTL Students** — Developer

---

<div align="center">
  <sub>Built with Next.js · Powered by Typhoon AI · Stored on Vercel Blob</sub>
</div>

// app/api/scan/demo/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { put } from "@vercel/blob"; 
import heicConvert from "heic-convert"; 

const client = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY,
  baseURL: "https://api.opentyphoon.ai/v1",
});

// ฟังก์ชัน OCR (เหมือนเดิม)
async function getRawTextFromImage(base64Image: string, mimeType: string) {
  const response = await client.chat.completions.create({
    model: "typhoon-ocr", 
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract all visible text. Return plain text only." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1, 
  });
  return response.choices[0].message.content || "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // ⚠️ DEMO MODE: ไม่เช็ค Session, ไม่เช็ค ShopId ⚠️

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;

    const isHeicMagic = buffer.subarray(4, 8).toString() === 'ftyp';

    // แปลง HEIC ถ้ามี
    const isHeic = 
      file.name.toLowerCase().endsWith(".heic") || 
      file.type === "image/heic" || 
      !file.type || 
      isHeicMagic; 

    if (isHeic) {
      console.log("🍏 HEIC detected. Converting to JPEG...");
      try {
        const outputBuffer = await heicConvert({ 
          buffer: buffer, 
          format: 'JPEG', 
          quality: 0.7 
        });
        buffer = Buffer.from(outputBuffer);
        mimeType = "image/jpeg";
      } catch (err) {
        console.error("HEIC Error:", err);
        return NextResponse.json({ error: "Failed to convert HEIC image" }, { status: 500 });
      }
    }

    // ---------------------------------------------------------
    // ☁️ ส่วนที่เปลี่ยน: Upload ขึ้น Vercel Blob
    // ---------------------------------------------------------
    // const uniqueSuffix = `demo-${Date.now()}`;
    // const ext = mimeType === "image/png" ? "png" : "jpg";
    // const filename = `${uniqueSuffix}.${ext}`;

    // // Upload ไปที่ Vercel Blob Storage
    // const blob = await put(filename, buffer, {
    //   access: 'public', // ตั้งเป็น public ให้หน้าเว็บดึงไปโชว์ได้
    // });

    // console.log("✅ Demo Upload Success:", blob.url);
    // const fileUrl = blob.url; // ใช้ URL จาก Cloud แทน path ในเครื่อง
    
    // ---------------------------------------------------------

    // ยิง OCR (ใช้ Buffer ตัวเดิมใน Memory ยิงไปเลย ไม่ต้องโหลดจาก URL)
    const base64Image = buffer.toString('base64');
    const rawText = await getRawTextFromImage(base64Image, mimeType);

    //  ส่งกลับแค่ Text กับ URL รูป
    return NextResponse.json({ 
        success: true, 
        // imageUrl: fileUrl, // ส่ง URL ของ Blob กลับไป
        rawText: rawText 
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Demo Scan Error:", error);
    return NextResponse.json({ error: error.message || "Scan failed" }, { status: 500 });
  }
}
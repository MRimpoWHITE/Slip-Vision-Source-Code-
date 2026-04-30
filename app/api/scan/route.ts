// app/api/scan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import OpenAI from "openai";
import { put } from "@vercel/blob";
import heicConvert from "heic-convert";
import sharp from "sharp";
import jsQR from "jsqr";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
const client = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY,
  baseURL: "https://api.opentyphoon.ai/v1",
});

// --------------------------------------------------------
// 🛠️ UTILITIES: ฟังก์ชันช่วยจัดระเบียบข้อมูล
// --------------------------------------------------------

async function compressImageForOCR(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .sharpen({ sigma: 2, m1: 0.5, m2: 3 })
    .modulate({ brightness: 1.1 })
    .jpeg({ quality: 85 })
    .toBuffer();
}

function normalizeBankName(rawBankName: string | null): string {
  if (!rawBankName) return "Unknown";

  const text = rawBankName.toLowerCase().trim();

  if (
    text.includes("kbank") ||
    text.includes("กสิกร") ||
    text.includes("kasikorn") ||
    text.includes("K+") ||
    text.includes("k+")
  )
    return "กสิกรไทย";
  if (
    text.includes("scb") ||
    text.includes("ไทยพาณิชย์") ||
    text.includes("siam commercial")
  )
    return "ไทยพาณิชย์";
  if (
    text.includes("ktb") ||
    text.includes("กรุงไทย") ||
    text.includes("krungthai")
  )
    return "กรุงไทย";
  if (
    text.includes("bbl") ||
    text.includes("กรุงเทพ") ||
    text.includes("bangkok bank") ||
    text.includes("ธนาคารกรุงเทพ")
  )
    return "กรุงเทพ";
  if (
    text.includes("ttb") ||
    text.includes("tmb") ||
    text.includes("ทหารไทย") ||
    text.includes("ธนชาต")
  )
    return "ทีทีบี";
  if (text.includes("gsb") || text.includes("ออมสิน")) return "ออมสิน";
  if (
    text.includes("bay") ||
    text.includes("กรุงศรี") ||
    text.includes("krungsri")
  )
    return "กรุงศรี";
  if (
    text.includes("baac") ||
    text.includes("ธ.ก.ส") ||
    text.includes("agriculture")
  )
    return "ธ.ก.ส.";
  if (text.includes("uob") || text.includes("ยูโอบี")) return "UOB";
  if (text.includes("kkp") || text.includes("เกียรตินาคิน"))
    return "เกียรตินาคิน";
  if (text.includes("cimb") || text.includes("ซีไอเอ็มบี")) return "CIMB";
  if (text.includes("lh") || text.includes("แลนด์")) return "LHB";

  return rawBankName.replace(/ธนาคาร|Bank|ธ\./gi, "").trim();
}

function cleanName(text: string | null): string | null {
  if (!text || text === "null") return null;
  let clean = text;
  clean = clean.replace(/Biller\s*ID\s*:\s*\S+/gi, "").trim();
  clean = clean.replace(
    /(Krungthai|กรุงไทย|KBank|กสิกร|SCB|ไทยพาณิชย์|BBL|กรุงเทพ|TTB|ทหารไทย|GSB|ออมสิน|Bank)/gi,
    "",
  );
  clean = clean.replace(/x{3}[-x\d]+/gi, "");
  clean = clean.replace(/\d{7,}/g, "");
  clean = clean.replace(
    /^(จาก|From|Sender|ถึง|To|Receiver|นาย|นาง|น\.?ส\.?|ด\.?ช\.?|ด\.?ญ\.?)\s+/i,
    "",
  );
  clean = clean.replace(/^MR([A-Z])/, "MR $1");
  clean = clean.replace(/^MRS([A-Z])/, "MRS $1");
  clean = clean.replace(/^MS([A-Z])/, "MS $1");
  return clean.trim() || null;
}

// --------------------------------------------------------
// STEP 1: OCR
// --------------------------------------------------------
async function getRawTextFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  console.log("👀 Step 1: Performing OCR via /v1/ocr endpoint...");

  // สร้าง FormData สำหรับ multipart upload (เหมือน playground)
  const formData = new FormData();

  const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
  formData.append(
    "file",
    blob,
    `slip.${mimeType === "image/png" ? "png" : "jpg"}`,
  );
  formData.append("model", "typhoon-ocr");
  formData.append(
    "task_type",
    "Extract ONLY text that is clearly visible in this image. Do NOT generate, invent, or hallucinate any text. If text is unclear or unreadable, skip it.",
  );
  formData.append("max_tokens", "1500");
  formData.append("temperature", "0.1");
  formData.append("top_p", "0.6");
  formData.append("repetition_penalty", "1.2");

  const response = await fetch("https://api.opentyphoon.ai/v1/ocr", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OCR API error:", response.status, err);
    throw new Error(`OCR failed: ${response.status}`);
  }

  const result = await response.json();

  const texts: string[] = [];
  for (const page of result?.results ?? []) {
    if (page.success && page.message) {
      const content = page.message.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = JSON.parse(content);
        texts.push(parsed.natural_text ?? content);
      } catch {
        texts.push(content);
      }
    } else if (!page.success) {
      console.warn("OCR page error:", page.error);
    }
  }

  const rawText = texts.join("\n");
  console.log("── OCR Response ──────────────────────────────");
  console.log(rawText);
  console.log("──────────────────────────────────────────────");
  return rawText;
}


function extractRefNoFromQR(payload: string): string | null {
  if (!payload) return null;

  function parseTLV(data: string): Map<string, string> {
    const fields = new Map<string, string>();
    let i = 0;
    while (i + 4 <= data.length) {
      const tag = data.substring(i, i + 2);
      const len = parseInt(data.substring(i + 2, i + 4), 10);
      if (isNaN(len) || len < 0 || i + 4 + len > data.length) break;
      fields.set(tag, data.substring(i + 4, i + 4 + len));
      i += 4 + len;
    }
    return fields;
  }

  try {
    // Try EMV tag 62 sub-tag 05 (Reference Label) first
    const root = parseTLV(payload);
    const additionalData = root.get("62");
    if (additionalData) {
      const sub = parseTLV(additionalData);
      const refLabel = sub.get("05");
      if (refLabel && refLabel.length >= 6) return refLabel;
    }

    const patterns: RegExp[] = [
      /016\d{9}[A-Z]{2,4}\d{3,5}/,                  // กสิกรไทย
      /2026\d{4}\d{22,}/,                           // ออมสิน (30+ ตัว, ก่อน SCB)
      /C?2026\d{4}[A-Za-z0-9]{10,25}?(?=5102TH|$)/, // กรุงเทพ (lookahead หยุดก่อน 5102TH)
      /[A-Za-z]{1,3}\d{3}[a-z0-9]{10,}/,            // กรุงไทย โอนเงิน
      /C?2026\d{4}[A-Za-z0-9]{10,25}/,               // ไทยพาณิชย์
      /0460[A-Za-z0-9]{16,20}/,                     //  KBank make
      /KSA\d{17}/,                                 //  กรุงศรี
      /MPI\d{18,}/,                                //  ธ.ก.ส.
      /2026\d{4}\d{9,21}/,                         //  TTB (ตัวเลขล้วน สั้นกว่าออมสิน)
      /20\d{6}[A-Za-z0-9]{6,}/,                   // fallback
    ];

    for (const pattern of patterns) {
      const m = payload.match(pattern);
      if (m) return m[0];
    }
  } catch {
    // ignore parse errors
  }

  return null;
}


async function decodeQRFromImage(
  fullBuffer: Buffer,
  compressedBuffer: Buffer,
): Promise<string | null> {

  async function tryDecodeBuffer(buf: Buffer, label: string): Promise<string | null> {
    try {
      const { data, info } = await sharp(buf)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
      if (code?.data) {
        console.log(`[QR Decode] ${label} found:`, code.data);
        return code.data;
      }
    } catch (e) {
      console.error(`[QR Decode] ${label} error:`, e);
    }
    return null;
  }

  // ── Attempt 1: upscale 3000px + sharpen ──
  try {
    const up = await sharp(fullBuffer)
      .resize(3000, 3000, { fit: "inside", withoutEnlargement: false })
      .sharpen()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const code = jsQR(new Uint8ClampedArray(up.data), up.info.width, up.info.height);
    if (code?.data) {
      console.log("[QR Decode] upscaled 3000px found:", code.data);
      return code.data;
    }
  } catch (e) {
    console.error("[QR Decode] upscale error:", e);
  }

  // ── Attempt 2: grayscale + threshold (แก้พื้นสีแดง/มืด) ──
  try {
    const processed = await sharp(fullBuffer)
      .resize(3000, 3000, { fit: "inside", withoutEnlargement: false })
      .grayscale()                        // แปลงเป็น grayscale ก่อน
      .normalise()                        // normalize contrast
      .threshold(128)                     // บังคับให้เป็น black/white ชัดๆ
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const code = jsQR(
      new Uint8ClampedArray(processed.data),
      processed.info.width,
      processed.info.height,
    );
    if (code?.data) {
      console.log("[QR Decode] grayscale+threshold found:", code.data);
      return code.data;
    }
  } catch (e) {
    console.error("[QR Decode] grayscale error:", e);
  }

  // ── Attempt 3: invert (สำหรับ QR สีขาวบนพื้นเข้ม) ──
  try {
    const inverted = await sharp(fullBuffer)
      .resize(3000, 3000, { fit: "inside", withoutEnlargement: false })
      .grayscale()
      .negate()                           // invert สี
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const code = jsQR(
      new Uint8ClampedArray(inverted.data),
      inverted.info.width,
      inverted.info.height,
    );
    if (code?.data) {
      console.log("[QR Decode] inverted found:", code.data);
      return code.data;
    }
  } catch (e) {
    console.error("[QR Decode] invert error:", e);
  }

  // ── Attempt 4: compressed fallback ──
  const fallback = await tryDecodeBuffer(compressedBuffer, "compressed fallback");
  if (!fallback) console.log("[QR Decode] ไม่เจอ QR ในรูป");
  return fallback;
}

// Send decoded QR payload string to Thunder API for verification
async function getThunderSlipData(payload: string) {
  console.log("⚡ Step Premium: Sending QR payload to Thunder API...");
  const apiKey = process.env.THUNDER_API_KEY;
  if (!apiKey) {
    console.error("THUNDER_API_KEY is not set in environment variables");
    return null;
  }

  try {
    const response = await fetch("https://api.thunder.in.th/v2/verify/bank", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Thunder API returned error:", response.status, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Thunder API Error:", error);
    return null;
  }
}

// --------------------------------------------------------
// Thunder Response Mapper
// Maps Thunder API response structure to our Slip schema fields
// --------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapThunderResponse(thunderData: any) {
  const raw = thunderData?.data?.rawSlip;
  if (!raw) return null;

  let date: string | null = null;
  let time: string | null = null;
  if (raw.date) {
    const d = new Date(raw.date);
    // Convert to local date/time strings
    date = d.toISOString().split("T")[0]; // YYYY-MM-DD
    // Extract HH:MM in local time (+07:00)
    const localHours = String(d.getUTCHours() + 7).padStart(2, "0");
    const localMinutes = String(d.getUTCMinutes()).padStart(2, "0");
    time = `${localHours}:${localMinutes}`;
  }

  // Prefer Thai name for sender, fallback to English
  const senderName =
    raw.sender?.account?.name?.th || raw.sender?.account?.name?.en || null;

  // Prefer English name for receiver (often cleaner for business names), fallback to Thai
  const receiverName =
    raw.receiver?.account?.name?.en || raw.receiver?.account?.name?.th || null;

  return {
    bank: raw.sender?.bank?.name || null,
    amount: thunderData.data?.amountInSlip ?? raw.amount?.amount ?? 0,
    date,
    time,
    sender: senderName,
    receiver: receiverName,
    refNo: raw.transRef || null,
    details: null,
  };
}

// --------------------------------------------------------
// STEP 2: REGEX PARSER (Primary)
// --------------------------------------------------------

interface SlipData {
  is_slip: boolean;
  bank: string | null;
  date: string | null;
  time: string | null;
  amount: number;
  sender: string | null;
  receiver: string | null;
  refNo: string | null;
}

function isHallucinatedText(text: string): boolean {
  // เลข 0 ยาวๆ ติดกัน = hallucination ชัดเจน
  if (/0{50,}/.test(text)) return true;
  // เลขบัตรประชาชน = ไม่ใช่สลิป
  if (/เลขประจำตัวประชาชน|เลขบัตร/.test(text)) return true;
  // วันเกิด = ไม่ใช่สลิป
  if (/วันเกิด\s*:/.test(text)) return true;
  // ใบเสร็จ/ใบแจ้งหนี้
  if (
    /ใบเสร็จ|ใบแจ้งหนี้|ใบกำกับภาษี|ภาษีมูลค่าเพิ่ม|กรุณาชำระเงินภายใน|SCB Counter/i.test(
      text,
    )
  )
    return true;
  return false;
}

function parseSlipWithRegex(text: string, qrPayload?: string | null): SlipData {
  
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // ── BANK ────────────────────────────────────────────────
  let bank: string | null = null;

  const bankSearchText = lines
    .filter((l) => !/shop|ร้าน|มณี|mobile|โมบาย|บิลเลอร์|biller/i.test(l))
    .slice(0, 8) // เอา 8 บรรทัดแรกที่ไม่ใช่ร้านค้า
    .join("\n");

  if (/ธนาคารกรุงเทพ|bangkok bank/i.test(text)) bank = "กรุงเทพ";
  else if (/ธนาคารกสิกร|kasikorn bank/i.test(text)) bank = "กสิกรไทย";
  else if (/ธนาคารไทยพาณิชย์|siam commercial/i.test(text)) bank = "ไทยพาณิชย์";
  else if (/ธนาคารกรุงไทย|krungthai bank/i.test(text)) bank = "กรุงไทย";
  else if (/ธนาคารออมสิน/i.test(text)) bank = "ออมสิน";
  else if (/ธนาคารกรุงศรี/i.test(text)) bank = "กรุงศรี";
  else if (/ธนาคารทหารไทย|ttb bank/i.test(text)) bank = "ทีทีบี";

  if (!bank) {
    if (/กสิกร|kbank/i.test(bankSearchText)) bank = "กสิกรไทย";
    else if (/scb|ไทยพาณิชย์/i.test(bankSearchText)) bank = "ไทยพาณิชย์";
    else if (/กรุงไทย|krungthai|ktb/i.test(bankSearchText)) bank = "กรุงไทย";
    else if (/กรุงเทพ|bbl/i.test(bankSearchText)) bank = "กรุงเทพ";
    else if (/ttb|tmb|ทหารไทย/i.test(bankSearchText)) bank = "ทีทีบี";
    else if (/ออมสิน|gsb/i.test(bankSearchText)) bank = "ออมสิน";
    else if (/กรุงศรี|krungsri/i.test(bankSearchText)) bank = "กรุงศรี";
    else if (/ธ\.ก\.ส|baac|BAAC/i.test(bankSearchText)) bank = "ธ.ก.ส.";
    else if (/uob|ยูโอบี/i.test(bankSearchText)) bank = "UOB";
    else if (/เกียรตินาคิน|kkp/i.test(bankSearchText)) bank = "เกียรตินาคิน";
    else if (/cimb/i.test(bankSearchText)) bank = "CIMB";
  }

  if (!bank) {
    if (/make\s*by\s*kbank|make by/i.test(bankSearchText)) bank = "กสิกรไทย";
    else if (/โอนเงินสำเร็จ/i.test(bankSearchText)) bank = "ไทยพาณิชย์";
    // else if (/บันทึกสลิปลงเครื่อง/i.test(text))  bank = "กสิกรไทย";
    else if (/จ่ายเงินสำเร็จ/i.test(text)) bank = "SCB";
    else if (/Mitteilung/i.test(text)) bank = "กรุงเทพ";
    else if (/Scan\s*to\s*Pay\s*Successful/i.test(bankSearchText)) bank = "กรุงศรี";
    else if (/เป๋าตัง|ถุงเงิน/i.test(text)) bank = "กรุงไทย";
    else if (/ttb touch/i.test(text)) bank = "ทีทีบี";
  }

  // ── AMOUNT ──────────────────────────────────────────────
  // รองรับ "290.00 THB", "290.00 บาท", "฿290.00"
  let amount = 0;
  const amountPatterns = [
    /จำนวนเงิน\s*[:\-\|]?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /ยอดโอน\s*[:\-\|]?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /ยอดชำระ\s*[:\-\|]?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /จำนวน\s*[:\-\|]?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /Amount[^\n]*\n([\d,]+(?:\.\d{1,2})?)\s*(?:THB|บาท)/im,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:THB|บาท)/i,
    /฿\s*([\d,]+(?:\.\d{1,2})?)/,
    /^([\d,]+\.\d{2})\n(?:ค่าธรรมเนียม|Fee)/im,
  ];
  for (const pattern of amountPatterns) {
    const m = text.match(pattern);
    if (m) {
      const candidate = parseFloat(m[1].replace(/,/g, ""));
      const feeMatch = text.match(/Fee[^\n]*\n([\d,]+(?:\.\d{1,2})?)/i);
      const feeVal = feeMatch ? parseFloat(feeMatch[1].replace(/,/g, "")) : -1;
      if (candidate !== feeVal || candidate > 0) {
        amount = candidate;
        break;
      }
    }
  }

  // ── DATE ────────────────────────────────────────────────
  let date: string | null = null;
  const EN_MONTHS: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const THAI_MONTHS: Record<string, string> = {
    "ม.ค.": "01",
    "ก.พ.": "02",
    "มี.ค.": "03",
    "เม.ย.": "04",
    "พ.ค.": "05",
    "มิ.ย.": "06",
    "ก.ค.": "07",
    "ส.ค.": "08",
    "ก.ย.": "09",
    "ต.ค.": "10",
    "พ.ย.": "11",
    "ธ.ค.": "12",
  };

  // "09 Apr 26" หรือ "09 Apr 2026"
  const enDateMatch = text.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/);
  if (enDateMatch) {
    const dd = enDateMatch[1].padStart(2, "0");
    const mm = EN_MONTHS[enDateMatch[2].toLowerCase()] ?? "01";
    let yyyy = parseInt(enDateMatch[3]);
    if (yyyy < 100) yyyy += 2000; // "26" → 2026
    date = `${yyyy}-${mm}-${dd}`;
  }

  // "9 เม.ย. 68" หรือ "9 เม.ย. 2568"
  if (!date) {
    const thDateMatch = text.match(
      /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/,
    );
    if (thDateMatch) {
      const dd = thDateMatch[1].padStart(2, "0");
      const mm = THAI_MONTHS[thDateMatch[2]] ?? "01";
      let yyyy = parseInt(thDateMatch[3]);
      if (yyyy < 100) yyyy += 2500;
      if (yyyy > 2400) yyyy -= 543;
      date = `${yyyy}-${mm}-${dd}`;
    }
  }

  // "2026-04-09" หรือ "09/04/2026"
  if (!date) {
    const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) date = isoMatch[0];
  }

  // ── TIME ────────────────────────────────────────────────
  let time: string | null = null;
  const timeMatch = text.match(/(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*น\.?)?/);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  // ── SENDER ──────────────────────────────────────────────
  // หาบรรทัดหลัง "From" ที่เป็นชื่อ (ไม่ใช่ตัวเลขหรือ keyword)
  let sender: string | null = null;

  const thaiSenderPatterns = [
    /(?:ผู้โอน|ผู้ซื้อ|จาก)[:\s]+(.+)/i,
    /^From$/i, // handled by line-by-line below
  ];

  const fromIdx = lines.findIndex((l) => /^From$/i.test(l));
  if (fromIdx !== -1) {
    for (let j = fromIdx + 1; j < Math.min(fromIdx + 4, lines.length); j++) {
      const candidate = lines[j];
      if (isPersonName(candidate)) {
        sender = candidate;
        break;
      }
    }
  }

  // ── RECEIVER ────────────────────────────────────────────
  // หาบรรทัดหลัง "To" ที่เป็นชื่อ (ข้าม Biller ID, REF, ตัวเลข)
  let receiver: string | null = null;
  const toIdx = lines.findIndex((l) => /^To$/i.test(l));
  if (toIdx !== -1) {
    for (let j = toIdx + 1; j < Math.min(toIdx + 4, lines.length); j++) {
      const candidate = lines[j];
      if (isPersonName(candidate) && !/^Biller/i.test(candidate)) {
        receiver = candidate;
        break;
      }
    }
  }

  // ── SENDER / RECEIVER (KTB bill payment pattern) ────────
  // สลิปกรุงไทย "จ่ายบิล": บรรทัดที่มีชื่อธนาคารต่อท้าย = sender
  // บรรทัดที่มีชื่อร้านค้า = receiver

  if (!sender || !receiver) {
    for (const line of lines) {
      if (
        !sender &&
        /(?:กสิกร|กรุงไทย|กรุงเทพ|ไทยพาณิชย์|ออมสิน|กรุงศรี|ทีทีบี)\s+[Xx\d]{3}/i.test(
          line,
        )
      ) {
        sender = line
          .replace(
            /(?:กสิกร|กรุงไทย|กรุงเทพ|ไทยพาณิชย์|ออมสิน|กรุงศรี|ทีทีบี).*/i,
            "",
          )
          .trim();
      }
      // receiver: มี "SHOP", "MOBILE", หรือชื่อร้านที่ขึ้นต้นด้วย SCB/KBank prefix
      if (
        !receiver &&
        /shop|mobile|โมบาย|มณี|mart|store/i.test(line) &&
        isPersonName(line.replace(/\(.*\)/, "").trim())
      ) {
        receiver = line
          .replace(/\(\d+\)/, "")
          .replace(/Service Code:\S+/i, "")
          .trim();
      }
    }
  }

  // ── REF NO ──────────────────────────────────────────────
  // Priority: Transaction reference > REF1 > Bank reference
  let refNo: string | null = null;
  const transRefMatch = text.match(
    /Transaction reference[^\n]*\n([A-Z0-9]{10,})/i,
  );
  const ref1Match = text.match(/REF1?[^\n]*\n([A-Z0-9]{6,})/i);
  const bankRefMatch = text.match(/Bank reference[^\n]*\n(\d{4,})/i);

  refNo = transRefMatch?.[1] ?? ref1Match?.[1] ?? bankRefMatch?.[1] ?? null;

  // inline pattern fallback: "รหัสอ้างอิง: XXXX" หรือ "เลขที่รายการ XXXX"
  if (!refNo) {
    const inlineRef = text.match(
      /(?:เลขที่รายการ|รหัสอ้างอิง|Ref(?:erence)?(?:\s*No\.?)?)[:\s]*([A-Z0-9]{6,})/i,
    );
    if (inlineRef) refNo = inlineRef[1];
  }

  // ── IS_SLIP ──────────────────────────────────────────────
  const SLIP_KW =
    /บาท|฿|THB|โอนเงิน|จ่ายบิล|ชำระ|สำเร็จ|successful|กสิกร|kbank|scb|ไทยพาณิชย์|กรุงไทย|กรุงเทพ|bangkok bank|ออมสิน|กรุงศรี|ทีทีบี|ttb|รหัสอ้างอิง|เลขที่รายการ|transaction reference/i;
  const is_slip = SLIP_KW.test(text);

  return { is_slip, bank, date, time, amount, sender, receiver, refNo };
}


// function detectBank(text: string, qrPayload?: string | null): string | null {
  
//   // ── สัญญาณ 1: ชื่อธนาคารตรงๆ (แม่นที่สุด) ──
//   if (/ธนาคารกรุงเทพ|bangkok bank/i.test(text))    return "กรุงเทพ";
//   if (/ธนาคารกสิกร|kasikorn bank/i.test(text))     return "กสิกรไทย";
//   if (/ธนาคารไทยพาณิชย์|siam commercial/i.test(text)) return "ไทยพาณิชย์";
//   if (/ธนาคารกรุงไทย|krungthai bank/i.test(text))  return "กรุงไทย";
//   if (/ธนาคารออมสิน/i.test(text))                  return "ออมสิน";
//   if (/ธนาคารกรุงศรี/i.test(text))                 return "กรุงศรี";
//   if (/ธนาคารทหารไทย|ttb bank/i.test(text))        return "ทีทีบี";
//   if (/ธ\.ก\.ส|baac family/i.test(text))           return "ธ.ก.ส.";

//   // ── สัญญาณ 2: UI header + หัวสลิป ──
//   const headerLines = text.split('\n').slice(0, 6).join('\n');
  
//   if (/krungthai|กรุงไทย/i.test(headerLines))      return "กรุงไทย";
//   if (/kbank|กสิกร/i.test(headerLines))            return "กสิกรไทย";
//   if (/scb|ไทยพาณิชย์/i.test(headerLines))        return "ไทยพาณิชย์";
//   if (/ttb/i.test(headerLines))                    return "ทีทีบี";
//   if (/gsb|ออมสิน/i.test(headerLines))            return "ออมสิน";
//   if (/Mitteilung/i.test(headerLines))             return "กรุงเทพ";
//   if (/make\s*by\s*kbank/i.test(headerLines))      return "กสิกรไทย";
//   if (/baac|ธ\.ก\.ส/i.test(headerLines))          return "ธ.ก.ส.";

//   // ── สัญญาณ 3: หัวสลิป + ประเภทรายการ ──
//   // กรุงไทย โอนเงิน vs จ่ายบิล มี ref format ต่างกัน
//   const isTransfer = /โอนเงินสำเร็จ|scan to pay successful/i.test(text);
//   const isBillPay  = /จ่ายบิลสำเร็จ|ชำระบิลสำเร็จ/i.test(text);

//   // ── สัญญาณ 4: QR ref pattern ──
//   if (qrPayload) {
//     if (/016\d{9}[A-Z]{2,4}\d{3,5}/.test(qrPayload))  return "กสิกรไทย";
//     if (/KSA\d{17}/.test(qrPayload))                   return "กรุงศรี";
//     if (/MPI\d{18,}/.test(qrPayload))                  return "ธ.ก.ส.";
//     if (/2026\d{4}\d{22,}/.test(qrPayload))            return "ออมสิน";
//     // กรุงไทย โอนเงิน ref มักเป็น alphanumeric สั้นๆ
//     if (isTransfer && /[A-Za-z]{1,3}\d{3}[a-z0-9]{10,}/.test(qrPayload)) return "กรุงไทย";
//     // กรุงไทย จ่ายบิล ref เป็นตัวเลขล้วน
//     if (isBillPay && /C?2026\d{4}\d{9,}/.test(qrPayload)) return "กรุงไทย";
//   }

//   // ── สัญญาณ 5: keyword ใน body (กรอง shop ออก) ──
//   const bodyLines = text.split('\n')
//     .filter(l => !/shop|mobile|โมบาย|มณี|biller/i.test(l))
//     .join('\n');

//   if (/กสิกร|kbank/i.test(bodyLines))              return "กสิกรไทย";
//   if (/scb|ไทยพาณิชย์/i.test(bodyLines))          return "ไทยพาณิชย์";
//   if (/กรุงไทย|krungthai/i.test(bodyLines))        return "กรุงไทย";
//   if (/กรุงเทพ|bbl/i.test(bodyLines))              return "กรุงเทพ";
//   if (/ttb|ทหารไทย/i.test(bodyLines))              return "ทีทีบี";
//   if (/ออมสิน|gsb/i.test(bodyLines))              return "ออมสิน";
//   if (/กรุงศรี|krungsri/i.test(bodyLines))         return "กรุงศรี";

//   return null;
// }



// ชื่อคน/ร้านค้า: มีตัวอักษร ไม่ใช่ล้วนตัวเลข ไม่ใช่ keyword สลิป
function isPersonName(s: string): boolean {
  if (!s || s.length < 2) return false;
  if (/^\d+$/.test(s)) return false; // ตัวเลขล้วน

  if (!s.includes(" ") && /^[A-Z0-9]{10,}$/.test(s)) return false;

  if (/^[A-Z0-9]{10,}$/.test(s.replace(/\s/g, ""))) return false; // ref code
  if (
    /^(Amount|From|To|Fee|REF|Biller|Transaction|Bank|Bangkok|Kasikorn|Krungthai|Scan|Mitteilung|successful|Favorite|Others|Share|jetzt|THB|Account|Conversion)/i.test(
      s,
    )
  )
    return false;
  if (/^\d{3}-\d/.test(s)) return false; // account no. เช่น 531-0-xxx630
  if (/\b(?:Bank|ธนาคาร|ธ\.)\b/i.test(s)) return false;
  return /[A-Za-zก-๙]/.test(s); // มีตัวอักษรอยู่บ้าง
}

// ── LLM Fallback (เรียกเฉพาะเมื่อ regex ได้ข้อมูลไม่ครบ) ──
async function llmFillMissingFields(
  structuredText: string,
  partial: SlipData,
): Promise<SlipData> {
  const missing = [];
  if (!partial.sender) missing.push("sender");
  if (!partial.receiver) missing.push("receiver");
  if (!partial.date) missing.push("date");
  if (!partial.refNo) missing.push("refNo");

  if (missing.length === 0) return partial; // ✅ ครบแล้ว ไม่ต้องเรียก LLM

  console.log(`🤖 LLM fallback for missing fields: ${missing.join(", ")}`);

  const SYSTEM = `You are extracting missing fields from a bank slip OCR text.
Return ONLY a JSON object with these fields: ${missing.join(", ")}.
Rules:
- sender/receiver = person or business name only, never account numbers or IDs
- date = YYYY-MM-DD ("09 Apr 26" → "2026-04-09", พ.ศ.2568 → 2025, 2569 → 2026)
- refNo = longest alphanumeric transaction reference
Output ONLY valid JSON, no markdown.`;

  try {
    const response = await client.chat.completions.create({
      model: "typhoon-v2.5-30b-a3b-instruct",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Bank slip text:\n\n${structuredText}` },
      ],
      max_tokens: 512,
      temperature: 0.6,
      top_p: 0.6,
      frequency_penalty: 0,
    });

    let content = response.choices[0].message.content || "{}";
    content = content.replace(/```json|```/g, "").trim();
    const filled = JSON.parse(content);

    // merge เฉพาะ field ที่ยังขาด
    for (const field of missing) {
      if (filled[field] && !(partial as any)[field]) {
        (partial as any)[field] = filled[field];
      }
    }
  } catch (e) {
    console.error("LLM fallback error:", e);
  }

  return partial;
}

// ── Main parser ──────────────────────────────────────────
async function parseTextToJSON(rawText: string): Promise<SlipData> {
  console.log("🔍 Step 2: Parsing slip...");

  if (!rawText || rawText.trim().length === 0) {
    console.warn("⚠️ OCR returned empty text.");
    return {
      is_slip: false,
      bank: null,
      date: null,
      time: null,
      amount: 0,
      sender: null,
      receiver: null,
      refNo: null,
    };
  }

  const cleanText = rawText
    .replace(/&lt;/g, "")
    .replace(/&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\*{1,3}([^*\n]*)\*{1,3}/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  if (isHallucinatedText(cleanText)) {
    console.warn("⚠️ OCR text looks hallucinated or not a slip — rejecting");
    return {
      is_slip: true,
      bank: null,
      date: null,
      time: null,
      amount: 0,
      sender: null,
      receiver: null,
      refNo: null,
    };
  }

  console.log("── OCR TEXT ──────────────────────────────────");
  console.log(cleanText);
  console.log("──────────────────────────────────────────────");

  // 1️⃣ Regex parse ก่อนเสมอ
  const result = parseSlipWithRegex(cleanText);
  console.log("📌 Regex result:", JSON.stringify(result));

  // 2️⃣ LLM เฉพาะ field ที่ยังขาด
  const final = await llmFillMissingFields(cleanText, result);
  console.log("✅ Final result:", JSON.stringify(final));

  return final;
}

// --------------------------------------------------------
// MAIN API HANDLER
// --------------------------------------------------------
export async function POST(req: Request) {
  const t0 = Date.now();
  const timing: Record<string, number> = {};

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, shopId: true },
    });

    if (!user || !user.shopId) {
      return NextResponse.json(
        { error: "คุณยังไม่มีสังกัดร้านค้า" },
        { status: 400 },
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: user.shopId },
      select: { plan: true },
    });

    const plan = shop?.plan || "free";
    // Read scan mode from request: "qr" uses Thunder API (premium only), "ocr" uses Typhoon OCR
    const scanMode = formData.get("mode") === "qr" ? "qr" : "ocr";

    if (plan === "free") {
      const limit = rateLimit(`scan:${user.shopId}`, 15, 60_000);
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Free plan จำกัด 15 ครั้ง/นาที" },
          { status: 429 },
        );
      }
    }
    // Premium plan has no rate limit

    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mimeType = file.type;

    const isHeicMagic = buffer.subarray(4, 8).toString() === "ftyp";

    // แปลง HEIC เป็น JPEG
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
          format: "JPEG",
          quality: 0.7,
        });
        buffer = Buffer.from(outputBuffer);
        mimeType = "image/jpeg";
      } catch (err) {
        console.error("HEIC Convert Error:", err);
      }
    }

    // ---------------------------------------------------------
    // ☁️ Upload (full) + OCR (compressed) parallel
    // ---------------------------------------------------------
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const filename = `slip-${uniqueSuffix}.${ext}`;

    // Compress for OCR (1200px max width) ลด latency
    const compressedBuffer = await compressImageForOCR(buffer);
    const base64Image = compressedBuffer.toString("base64");

    // ---------------------------------------------------------
    // ☁️ Upload Blob (full) และประมวลผลข้อมูลสลิป
    // ---------------------------------------------------------
    let d: any;
    let blob;
    let verified = false; // true only when Thunder successfully verifies via QR
    let detectedQrRefNo: string | null = null;
    let scanPath = "ocr"; // track which path was taken

    if (plan === "premium" && scanMode === "qr") {
      const tQr = Date.now();
      const [uploadedBlob, qrPayload] = await Promise.all([
        put(filename, buffer, { access: "public" }),
        decodeQRFromImage(buffer, compressedBuffer),
      ]);
      blob = uploadedBlob;

      if (qrPayload) {
        const thunderRaw = await getThunderSlipData(qrPayload);
        timing.thunder_ms = Date.now() - tQr;
        if (thunderRaw && typeof thunderRaw === "object" && !thunderRaw.error) {
          d = mapThunderResponse(thunderRaw);
          verified = true;
          scanPath = "thunder";
        } else {
          console.warn("⚡→OCR Thunder verification failed, falling back to OCR");
          scanPath = "thunder_fail→ocr";
          const tOcr = Date.now();
          const rawText = await getRawTextFromImage(compressedBuffer, mimeType);
          timing.ocr_ms = Date.now() - tOcr;
          const tParse = Date.now();
          d = await parseTextToJSON(rawText);
          timing.parser_ms = Date.now() - tParse;
          // Thunder failed but QR still available — override refNo with QR (more accurate than OCR)
          detectedQrRefNo = extractRefNoFromQR(qrPayload);
          if (detectedQrRefNo) {
            console.log(`📱 QR refNo override: ${detectedQrRefNo}`);
            d.refNo = detectedQrRefNo;
          }
        }
      } else {
        console.warn("🔍→OCR No QR code found in image, falling back to OCR");
        scanPath = "no_qr→ocr";
        const tOcr = Date.now();
        const rawText = await getRawTextFromImage(compressedBuffer, mimeType);
        timing.ocr_ms = Date.now() - tOcr;
        const tParse = Date.now();
        d = await parseTextToJSON(rawText);
        timing.parser_ms = Date.now() - tParse;
      }
    } else {
      // Free plan or premium OCR mode: OCR + QR decode in parallel
      const tOcr = Date.now();
      const [uploadedBlob, rawText, qrPayload] = await Promise.all([
        put(filename, buffer, { access: "public" }),
        getRawTextFromImage(compressedBuffer, mimeType),
        decodeQRFromImage(buffer, compressedBuffer),
      ]);
      timing.ocr_ms = Date.now() - tOcr;
      blob = uploadedBlob;
      const tParse = Date.now();
      d = await parseTextToJSON(rawText);
      timing.parser_ms = Date.now() - tParse;
      // Override refNo with QR if available (more accurate than OCR)
      if (qrPayload) {
        detectedQrRefNo = extractRefNoFromQR(qrPayload);
        if (detectedQrRefNo) {
          console.log(`📱 QR refNo override: ${detectedQrRefNo}`);
          d.refNo = detectedQrRefNo;
        }
      }
    }

    console.log("✅ Uploaded to Blob:", blob.url);
    const fileUrl = blob.url;

    // ตรวจสอบว่า LLM บอกว่าเป็นสลิปหรือเปล่า
    const isSlip = d.is_slip !== false; // default true ถ้าไม่มี field นี้ (backward compat)
    if (!isSlip) {
      console.warn("⚠️ LLM classified image as NOT a bank slip");
    }

    // เตรียมข้อมูลลง DB
    const amount = isSlip
      ? typeof d.amount === "number"
        ? d.amount
        : parseFloat(String(d.amount || 0).replace(/,/g, ""))
      : 0;
    const standardizedBankName = isSlip ? normalizeBankName(d.bank) : "Unknown";

    // เช็คสลิปซ้ำ (เฉพาะเมื่อเป็นสลิปจริง)
    let isDuplicate = false;
    if (isSlip && d.refNo) {
      const existingSlip = await prisma.slip.findFirst({
        where: { refNo: d.refNo },
        select: { id: true },
      });
      if (existingSlip) {
        isDuplicate = true;
        console.warn(`⚠️ ตรวจเจอสลิปซ้ำ: refNo ${d.refNo}`);
      }
    }

    let autoNote = "";

    if (!isSlip) {
      autoNote = "[ไม่ใช่สลิปธนาคาร] ";
    } else {
      if (!d.bank || !d.amount || !d.refNo || !d.sender || !d.receiver)
        autoNote += "[ตรวจพบข้อมูลไม่ครบ กรุณาตรวจสอบรูปภาพ] ";
      if (isDuplicate) autoNote += "[ตรวจพบสลิปซ้ำ?] ";
      if (amount <= 0) autoNote += "[ตรวจพบยอดเงินเป็น 0?] ";
      if (d.date && new Date(d.date) > new Date())
        autoNote += "[ตรวจพบวันที่ในอนาคต?] ";
    }

    const tDb = Date.now();
    // DB write + AuditLog ใน transaction เดียวกัน (atomic)
    const newSlip = await prisma.$transaction(async (tx) => {
      const slip = await tx.slip.create({
        data: {
          shopId: user.shopId,
          bank: standardizedBankName,
          date: isSlip ? d.date || null : null,
          time: isSlip ? d.time || null : null,
          amount: isNaN(amount) ? 0 : amount,
          details: autoNote || "",
          sender: isSlip ? cleanName(d.sender) : null,
          receiver: isSlip ? cleanName(d.receiver) : null,
          refNo: isSlip ? d.refNo || null : null,
          imageUrl: fileUrl,
          verified: isSlip ? verified : false,
          uploadedById: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          shopId: user.shopId!,
          actorId: user.id,
          action: "UPLOAD",
          targetType: "SLIP",
          targetId: String(slip.id),
          details: {
            filename: filename,
            amount: slip.amount,
            bank: slip.bank,
            raw_ai_data: d,
          },
        },
      });

      return slip;
    });
    timing.db_ms = Date.now() - tDb;
    timing.total_ms = Date.now() - t0;

    return NextResponse.json({
      success: true,
      data: newSlip,
      qr_refno: detectedQrRefNo,
      scan_path: scanPath,
      timing,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Scan Error:", error);
    return NextResponse.json(
      { error: error.message || "Scan failed" },
      { status: 500 },
    );
  }
}

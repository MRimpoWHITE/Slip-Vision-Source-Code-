// lib/slip-parser.ts

interface SlipData {
  bank: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  sender: string | null;
  receiver: string | null;
  ref: string | null;
}

export function parseSlipData(rawText: string): SlipData {
  
  // 1. Pre-processing: สับข้อความให้แยกบรรทัดอย่างชัดเจน
  const formattedText = rawText
    // แยกส่วน Header (Transaction Completed ฯลฯ)
    .replace(/(Transaction Completed|Transfer Completed|โอนเงินสำเร็จ|ทำรายการสำเร็จ)/ig, "\n$1\n")
    // แยกชื่อคนที่มีคำนำหน้า (นี่คือจุดแก้สำคัญ! เจอ Ms./Mr. ให้ขึ้นบรรทัดใหม่เลย)
    .replace(/(Mr\.|Ms\.|Mrs\.|Miss\.|นาย|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.)/ig, "\n$1")
    // แยกธนาคาร
    .replace(/(KBank|KBANK|กสิกร|SCB|ไทยพาณิชย์|BBL|กรุงเทพ|KTB|กรุงไทย|TTB|ทหารไทย|GSB|ออมสิน|Bank)/ig, "\n$1")
    // แยก PromptPay / Account
    .replace(/(PromptPay|Prompt Pay|พร้อมเพย์|Account|รหัส|Acc No)/ig, "\n$1")
    // แยกยอดเงิน / วันที่
    .replace(/(Amount|จำนวน|ยอดเงิน)/ig, "\n$1")
    .replace(/(Transaction ID|Ref No|เลขที่รายการ)/ig, "\n$1");

  const lines = formattedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // ตัวแปรเก็บค่า (ใช้ let เพราะต้องเปลี่ยนค่า)
  let bank: string | null = null;
  let date: string | null = null;
  let time: string | null = null;
  let amount: number | null = null;
  let sender: string | null = null;
  let receiver: string | null = null;
  let ref: string | null = null; 

  const fullText = rawText.toLowerCase();

  // --- 1. หาธนาคาร ---
  if (fullText.includes("k+") || fullText.includes("กสิกร") || fullText.includes("kasikorn") || fullText.includes("kbank")) {
    bank = "กสิกรไทย (KBANK)";
  } else if (fullText.includes("scb") || fullText.includes("ไทยพาณิชย์")) {
    bank = "ไทยพาณิชย์ (SCB)";
  } else if (fullText.includes("krungthai") || fullText.includes("กรุงไทย") || fullText.includes("ktb")) {
    bank = "กรุงไทย (KTB)";
  } else if (fullText.includes("bualuang") || fullText.includes("bangkok bank") || fullText.includes("bbl")) {
    bank = "กรุงเทพ (BBL)";
  } else if (fullText.includes("ttb") || fullText.includes("ทหารไทย")) {
    bank = "ทหารไทยธนชาต (ttb)";
  } else if (fullText.includes("gsb") || fullText.includes("ออมสิน")) {
    bank = "ออมสิน (GSB)";
  } else {
    bank = "Unknown Bank";
  }

  // Regex
  const dateRegex = /(\d{1,2})\s*([ม.ค.|ก.พ.|มี.ค.|เม.ย.|พ.ค.|มิ.ย.|ก.ค.|ส.ค.|ก.ย.|ต.ค.|พ.ย.|ธ.ค.|A-Za-z.]+)\s*(\d{2,4})/;
  const timeRegex = /(\d{1,2}):(\d{2})/;
  const amountRegex = /(\d{1,3}(?:,\d{3})*|\d+)\.(\d{2})/;

  // คำต้องห้าม (ใช้กรองชื่อ)
  const invalidNameKeywords = ["ธนาคาร", "bank", "kbank", "scb", "bbl", "ktb", "ttb", "gsb", "ธ.", "รหัส", "promptpay", "prompt pay", "account", "amount", "จำนวน", "transaction", "completed", "transfer", "fee", "verified", "slip", "free"];
  
  // คำนำหน้าชื่อ (เพิ่ม Case Insensitive)
  const namePrefixes = ["นาย", "นาง", "น.ส.", "ด.ช.", "ด.ญ.", "mr", "mrs", "ms", "miss"];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    const cleanLine = line.replace(/,/g, '');

    // วันที่
    if (!date) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) date = dateMatch[0];
    }
    // เวลา
    if (!time) {
       const timeMatch = line.match(timeRegex);
       if (timeMatch) time = timeMatch[0];
    }
    // ยอดเงิน
    if (!amount) {
        if (lineLower.includes("จำนวน") || lineLower.includes("amount") || lineLower.includes("โอนเงิน")) {
            const amountMatch = cleanLine.match(amountRegex);
            if (amountMatch) amount = parseFloat(amountMatch[0]);
        }
    }
    // Ref
    if (!ref && (lineLower.includes("เลขที่รายการ") || lineLower.includes("ref") || lineLower.includes("transaction id"))) {
        const refParts = line.split(":");
        if (refParts.length > 1) ref = refParts[1].trim().split(" ")[0];
    }

    // --- LOGIC หาชื่อผู้โอน (Sender) ---
    // ใช้ Prefix เป็นตัวจับหลัก
    const hasPrefix = namePrefixes.some(prefix => {
        // เช็คว่ามี prefix อยู่หน้าสุด หรือมี . ตามหลัง (เช่น Ms.)
        return lineLower.startsWith(prefix.toLowerCase()) || lineLower.includes(prefix.toLowerCase() + ".");
    });
    
    if (hasPrefix) {
        if (!sender) {
            // ลบคำว่า From/Sender ออกก่อนเก็บ
            sender = line.replace(/^(จาก|From|Sender)\s*[:\.]?\s*/i, "").trim();
        } else if (!receiver) {
             if (line !== sender) {
                receiver = line.replace(/^(ถึง|To|Receiver)\s*[:\.]?\s*/i, "").trim();
             }
        }
    }
  }

  // --- LOGIC หาชื่อผู้รับ (Receiver) แบบ Fallback ---
  // ถ้ายังไม่เจอผู้รับ ให้ลองหาบรรทัดที่อยู่ก่อน "PromptPay" หรือ "Account"
  if (!receiver) {
      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineLower = line.toLowerCase();

          // ถ้าเจอบรรทัด PromptPay หรือ เลขบัญชี
          if (lineLower.includes("promptpay") || lineLower.includes("prompt pay") || lineLower.includes("พร้อมเพย์") || (lineLower.includes("xxx-") && line.length > 15)) {
              
              if (i > 0) {
                  let candidate = lines[i-1];
                  
                  // 🔥 ทีเด็ด: ถ้าบรรทัดชื่อ มีขยะติดมา (เช่น KBank XXX-XXX PITTINUN) ให้ลบทิ้ง!
                  // ลบชื่อธนาคารออก
                  candidate = candidate.replace(/(KBank|KBANK|SCB|KTB|BBL|TTB|GSB|Bank|ธนาคาร|กสิกร|ไทยพาณิชย์)/ig, "");
                  // ลบเลขบัญชี (xxx-x-xxxxx-x) ออก
                  candidate = candidate.replace(/x{3}[-x\d]+/ig, "");
                  
                  candidate = candidate.trim();

                  // เช็คว่าสิ่งที่เหลืออยู่ น่าจะเป็นชื่อไหม?
                  const isSender = candidate === sender;
                  // ต้องยาวพอสมควร และไม่ใช่คำต้องห้ามที่เหลืออยู่
                  const containsInvalid = invalidNameKeywords.some(k => candidate.toLowerCase().includes(k));

                  if (!isSender && !containsInvalid && candidate.length > 3) {
                      receiver = candidate;
                      break;
                  }
              }
          }
      }
  }

  // Fallback Amount สุดท้าย
  if (!amount) {
      const backupMatch = rawText.replace(/,/g, '').match(/(\d+\.\d{2})/);
      if (backupMatch) amount = parseFloat(backupMatch[0]);
  }

  return { bank, date, time, amount, sender, receiver, ref };
}
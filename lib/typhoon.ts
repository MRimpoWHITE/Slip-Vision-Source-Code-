// lib/typhoon.ts
import OpenAI from "openai";


export interface SlipData {
  sender: string | null;
  receiver: string | null;
  bank: string | null;
  amount: number;
  date: string | null;
  time: string | null;
}

const client = new OpenAI({
  apiKey: process.env.TYPHOON_API_KEY,
  baseURL: "https://api.opentyphoon.ai/v1",
});

// กำหนดว่าฟังก์ชันนี้จะคืนค่าเป็น SlipData หรือ null เท่านั้น
export async function extractSlipData(base64Image: string): Promise<SlipData | null> {
  try {
    const response = await client.chat.completions.create({
      model: "typhoon-ocr", 
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "แกะข้อมูลจากสลิปโอนเงินนี้ ขอ output เป็น JSON object เท่านั้น โดยมี key: sender, receiver, bank, amount (number), date (YYYY-MM-DD), time (xx:xx). ถ้าอ่านไม่ออกให้ใส่ null"
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    
    // ล้าง Markdown
    const cleanContent = content?.replace(/```json|```/g, '').trim();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawData: any = {};
    
    try {
      rawData = JSON.parse(cleanContent || "{}");
    } catch (e) {
      console.error("JSON Parse Error:", e);
      // ถ้าพัง ให้ส่ง object ว่างไปเข้า sanitize (มันจะแปลงเป็น null ให้เอง)
      rawData = {}; 
    }

    return sanitizeSlipData(rawData);

  } catch (error) {
    console.error("Typhoon Error:", error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeSlipData(data: any): SlipData {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractText = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val; 
    if (typeof val === 'object') return val.name || val.text || JSON.stringify(val);
    return String(val);
  };

  let amount = 0.0;
  if (data.amount) {
    const amountStr = String(data.amount).replace(/บาท|THB|,/gi, '').trim();
    amount = parseFloat(amountStr);
    if (isNaN(amount)) amount = 0.0;
  }

  let dateStr = extractText(data.date);
  let timeStr = extractText(data.time);

  if (timeStr && timeStr.length > 10 && !timeStr.includes(":")) {
     timeStr = null; 
  }
  
  if (data.dateTime || (dateStr && dateStr.includes(':'))) {
    const fullStr: string = data.dateTime || dateStr || "";
    const timeMatch = fullStr.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
        timeStr = timeMatch[0];
        dateStr = fullStr.replace(timeStr, '').trim();
    }
  }


  return {
    sender: extractText(data.sender),
    receiver: extractText(data.receiver),
    bank: extractText(data.bank),
    amount: amount,
    date: dateStr,
    time: timeStr
  };
}
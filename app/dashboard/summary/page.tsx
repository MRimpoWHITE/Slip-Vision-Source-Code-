// app/dashboard/summary/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route"; // ตรวจสอบ Path นี้ให้ตรงกับโปรเจค
import { redirect } from "next/navigation";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth 
} from "date-fns"; // ต้องลง npm install date-fns
import { th } from "date-fns/locale";
import SummaryCharts from "@/components/SummaryCharts"; // ตรวจสอบ Path นี้ด้วยครับ

// --- Icons ---
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  BarChart3 
} from "lucide-react";

// ✅ รับ shopId เข้ามาเพื่อกรองข้อมูล
async function getSlipsInRange(shopId: number, start: Date, end: Date) {
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return await prisma.slip.findMany({
    where: {
      shopId: shopId,
      OR: [
        // สลิปที่มีวันที่ → กรองด้วย date
        { date: { gte: startStr, lte: endStr } },
        // สลิปที่ OCR ดึง date ไม่ได้ (null) → กรองด้วย createdAt แทน
        { date: null, createdAt: { gte: start, lte: end } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  
  // 1. 👮‍♂️ ตรวจสอบสิทธิ์และหาร้านค้า
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true }
  });

  // ถ้าไม่มีร้าน หรือ shopId เป็น null ให้ดีดไปหน้า user-info
  if (!user || user.shopId === null) {
    redirect("/user-info");
  }

  const view = sp.view || "daily"; 
  const dateParam = sp.date ? new Date(sp.date) : new Date();

  let start = startOfDay(dateParam);
  let end = endOfDay(dateParam);
  let dateFormatString = "HH:00"; 

  if (view === "weekly") {
    start = startOfWeek(dateParam, { weekStartsOn: 1 }); 
    end = endOfWeek(dateParam, { weekStartsOn: 1 });
    dateFormatString = "eee d"; 
  } else if (view === "monthly") {
    start = startOfMonth(dateParam);
    end = endOfMonth(dateParam);
    dateFormatString = "d MMM"; 
  }

  // ✅ มั่นใจได้ว่า user.shopId ไม่เป็น null แล้วเพราะเช็คข้างบน
  const slips = await getSlipsInRange(user.shopId, start, end);

  // Logic คำนวณกราฟ
  const lineDataMap = new Map<string, number>();
  if (view === "daily") {
     for(let i=0; i<24; i++) lineDataMap.set(`${String(i).padStart(2, '0')}:00`, 0);
  }

  slips.forEach(slip => {
    let slipDate: Date;
    if (slip.date) {
      const timeStr = slip.time ? slip.time : "00:00";
      slipDate = new Date(`${slip.date}T${timeStr}:00`);
    } else {
      slipDate = new Date(slip.createdAt);
    }
    const key = format(slipDate, dateFormatString, { locale: th });
    const current = lineDataMap.get(key) || 0;
    lineDataMap.set(key, current + (slip.amount ?? 0));
  });

  const lineData = Array.from(lineDataMap.entries()).map(([name, total]) => ({ name, total }));

  const bankDataMap = new Map<string, number>();
  slips.forEach(slip => {
    const bankName = slip.bank || "Unknown";
    const cleanBank = bankName.split(" ")[0]; 
    const current = bankDataMap.get(cleanBank) || 0;
    bankDataMap.set(cleanBank, current + (slip.amount ?? 0));
  });

  const pieData = Array.from(bankDataMap.entries()).map(([name, value]) => ({ name, value }));
  const grandTotal = slips.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mb-2 transition-colors group">
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> กลับสู่หน้าแดชบอร์ด
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight dark:text-white">📊 สรุปภาพรวมรายได้</h1>
            <p className="text-sm text-gray-600 mt-2 font-semibold flex items-center gap-2 dark:text-gray-400">
              <Calendar size={16} />
              {format(start, "d MMM yyyy", { locale: th })} - {format(end, "d MMM yyyy", { locale: th })}
            </p>
          </div>

          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 dark:bg-slate-900 dark:border-slate-800 flex flex-wrap items-center gap-3 transition-colors">
            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1.5 border border-gray-200 dark:border-slate-700">
              {['daily', 'weekly', 'monthly'].map((v) => (
                <Link
                  key={v}
                  href={`/dashboard/summary?view=${v}&date=${sp.date || ''}`}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                    view === v
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5 dark:bg-slate-700 dark:text-blue-300 dark:ring-0'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {v === 'daily' ? 'รายวัน' : v === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                </Link>
              ))}
            </div>

            <form action="/dashboard/summary" method="GET" className="flex items-center gap-3 flex-wrap">
              <input type="hidden" name="view" value={view} />
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="date"
                  name="date"
                  defaultValue={sp.date || new Date().toISOString().split('T')[0]}
                  className="pl-11 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all active:scale-95">
                ค้นหา
              </button>
            </form>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-linear-to-br from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 bg-white/10 w-40 h-40 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-widest opacity-90 mb-2">
                <TrendingUp size={16} /> ยอดรวมรายได้ทั้งหมด
              </div>
              <h2 className="text-5xl font-black tracking-tight leading-none">฿{grandTotal.toLocaleString()}</h2>
              <div className="flex items-center gap-4 mt-4">
                <div className="bg-white/20 backdrop-blur-lg px-4 py-2 rounded-lg text-sm font-bold border border-white/20">
                  {slips.length} รายการสลิป
                </div>
                <div className="text-blue-100/80 text-xs font-semibold italic">
                  สรุปผลแบบ{view === 'daily' ? 'รายวัน' : view === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between group hover:border-purple-300 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:hover:border-purple-800">
            <div>
              <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform dark:bg-purple-900/30">
                <FileText className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest dark:text-gray-400">ค่าเฉลี่ยต่อสลิป</p>
              <h3 className="text-3xl font-black text-gray-900 mt-2 dark:text-white">
                ฿{slips.length > 0 ? (grandTotal / slips.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
              </h3>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-600 cursor-pointer hover:gap-2 transition-all dark:text-purple-400">
              วิเคราะห์รายละเอียด <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">แนวโน้มและสถิติการขาย</h2>
          </div>
          <div className="w-full min-h-96">
            <SummaryCharts lineData={lineData} pieData={pieData} viewMode={view} />
          </div>
        </div>
      </div>
    </div>
  );
}
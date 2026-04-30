// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { TrendingUp, FileText, Clock, CalendarDays, Wallet } from "lucide-react";
import DashboardQuickActions from "@/components/DashboardQuickActions"; 
import { getServerSession } from "next-auth"; // ✅ เพิ่ม: เพื่อดึง Session
import { authOptions } from "../api/auth/[...nextauth]/route"; // ✅ เพิ่ม: Config ของ NextAuth
import { redirect } from "next/navigation";
import { Toaster, toast } from 'react-hot-toast';

export const dynamic = "force-dynamic"; 


export default async function DashboardHome() {

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/"); // ถ้าไม่มี session ดีดออก
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      shopId: true
    }
  });

  // ถ้าไม่มีร้าน ให้ไปหน้า user-info
  if (!user || !user.shopId) {
    redirect("/user-info");
  }

  const shopId = user.shopId;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { plan: true }
  });
  const shopPlan = shop?.plan ?? "free";
  const today = new Date();
  
  //Query ข้อมูล (กรองด้วย shopId ทั้งหมด)
  const totalIncome = await prisma.slip.aggregate({
    where: { shopId }, // กรองเฉพาะร้านเรา
    _sum: { amount: true },
  });

  const totalSlips = await prisma.slip.count({
    where: { shopId } // กรองเฉพาะร้านเรา
  });

  const pendingCount = await prisma.slip.count({
    where: {
      shopId, // กรองเฉพาะร้านเรา
      OR: [
        { details: null },
        { details: "" }
      ]
    }
  });

  const recentSlips = await prisma.slip.findMany({
    where: { shopId }, // กรองเฉพาะร้านเรา
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10 font-sans dark:bg-slate-950 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight dark:text-white">
            สวัสดี, <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {user.name || "User"}
            </span> 👋
          </h1>
          <p className="text-gray-500 mt-2 font-medium flex items-center gap-2 dark:text-gray-400">
            <CalendarDays size={18} className="text-blue-500 dark:text-blue-400"/>
            {today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <DashboardQuickActions plan={shopPlan} />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Income */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors group dark:bg-slate-900 dark:border-slate-800 dark:hover:border-blue-900">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform dark:bg-blue-900/20 dark:text-blue-400">
                <Wallet size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest dark:text-gray-500">รายได้รวมทั้งหมด</p>
            <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight dark:text-white">
              ฿{(totalIncome._sum.amount ?? 0).toLocaleString()}
            </h3>
          </div>

          {/* Card 2: Slips */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors group dark:bg-slate-900 dark:border-slate-800 dark:hover:border-purple-900">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform dark:bg-purple-900/20 dark:text-purple-400">
                <FileText size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest dark:text-gray-500">จำนวนสลิป</p>
            <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight dark:text-white">
              {totalSlips.toLocaleString()} <span className="text-lg text-gray-400 font-medium dark:text-gray-500">รายการ</span>
            </h3>
          </div>

          {/* Card 3: Pending */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-orange-200 transition-colors group dark:bg-slate-900 dark:border-slate-800 dark:hover:border-orange-900">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform dark:bg-orange-900/20 dark:text-orange-400">
                <Clock size={24} />
              </div>
              {pendingCount > 0 && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest dark:text-gray-500">รอตรวจสอบ/ระบุข้อมูล</p>
            <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight dark:text-white">
              {pendingCount} <span className="text-lg text-gray-400 font-medium dark:text-gray-500">รายการ</span>
            </h3>
          </div>
        </div>

        {/* Recent Slips Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 dark:bg-slate-800/50 dark:border-slate-800">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2 dark:text-white">
              <TrendingUp size={20} className="text-blue-600 dark:text-blue-400"/> รายการล่าสุด
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-2 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">เวลาอัปโหลด</th>
                  <th className="px-6 py-2 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ผู้โอน</th>
                  <th className="px-6 py-2 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ธนาคาร</th>
                  <th className="px-6 py-2 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">ยอดเงิน</th>
                  <th className="px-6 py-2 text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {recentSlips.map((slip) => {
                  const isDuplicate = slip.details?.includes("[สลิปซ้ำ?]");
                  return (
                    <tr 
                      key={slip.id} 
                      className={`transition-colors ${
                        isDuplicate 
                          ? "bg-yellow-50/60 hover:bg-yellow-100/80 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20" 
                          : "hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          {new Date(slip.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(slip.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short'})}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {slip.sender || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] text-gray-600 font-bold border border-gray-200 whitespace-nowrap dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700">
                          {slip.bank || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-green-600 dark:text-green-400">
                          {/* ✅ แก้ Error TS ตรงนี้ด้วย */}
                          ฿{(slip.amount ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {slip.details ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                            isDuplicate 
                              ? "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" 
                              : "text-green-600 bg-green-50 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isDuplicate ? "bg-orange-500" : "bg-green-500"}`}></span> 
                            {slip.details || "N/A"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> รอข้อมูล
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {recentSlips.length === 0 && (
                   <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-medium dark:text-gray-500">ยังไม่มีข้อมูลสลิปวันนี้</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
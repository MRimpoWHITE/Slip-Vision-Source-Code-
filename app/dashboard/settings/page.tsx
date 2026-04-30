// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  User, Store, Moon, LogOut, Sun, Globe, Loader2,
  AlertTriangle, Trash2, Zap, CheckCircle2, XCircle,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { useRouter } from "next/navigation";
// ✅ 1. Import useAlert Hook instead of Modal component directly
import { useAlert } from "@/components/providers/AlertProvider";

type SettingsData = {
  role: string;
  name: string;
  shop?: {
    name: string;
    accountNo: string;
    inviteCode: string;
    plan: string;
    planExpiredAt: string | null;
  };
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { data: session, update } = useSession();
  const router = useRouter();
  
  // ✅ 2. Use the global alert hook
  const { showAlert } = useAlert();

  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  // Form State
  const [shopName, setShopName] = useState("");
  const [accountNo, setAccountNo] = useState("");

  // 1. Fetch Data
  useEffect(() => {
    if (session) {
      fetch("/api/user")
        .then((res) => res.json())
        .then((userData) => {
          setData(userData);
          if (userData.shop) {
            setShopName(userData.shop.name);
            setAccountNo(userData.shop.accountNo || "");
          }
          setLoading(false);
        });
    }
  }, [session]);

  // 2. Save Shop
  const handleSaveShop = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName, accountNo })
      });
      
      if (res.ok) {
        showAlert('success', 'บันทึกสำเร็จ', 'ข้อมูลร้านค้าถูกอัปเดตเรียบร้อยแล้ว');
        router.refresh(); 
      } else {
        showAlert('error', 'บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert('error', 'เชื่อมต่อล้มเหลว', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  // 3. Leave Shop
  const handleLeaveShopTrigger = () => {
    showAlert('delete', 'ยืนยันการลาออก', 'คุณแน่ใจหรือไม่ว่าจะออกจากร้านค้านี้?', async () => {
        // No need to closeAlert() manually, the provider handles it
        await performLeaveShop();
    });
  };

  const performLeaveShop = async () => {
    try {
      const res = await fetch("/api/shop/leave", { method: "POST" });
      const data = await res.json();
      
      if (res.ok) {
         // Force session update to reflect changes
         await update(); 
         
         showAlert('success', 'ดำเนินการสำเร็จ', 'คุณได้ออกจากร้านเรียบร้อยแล้ว', () => {
            window.location.href = "/user-info";
         });
      } else {
         showAlert('error', 'ผิดพลาด', data.error);
      }
    } catch (error) {
      console.error("Error:", error);
       showAlert('error', 'ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // 4. Change Plan
  const handleChangePlan = (targetPlan: "free" | "premium") => {
    const isPremium = targetPlan === "premium";
    showAlert(
      isPremium ? "warning" : "delete",
      isPremium ? "อัปเกรดเป็น Premium Vision" : "ดาวน์เกรดเป็น Standard",
      isPremium
        ? "คุณต้องการอัปเกรดเป็นแผน Premium Vision (฿199/เดือน) ใช่หรือไม่?"
        : "คุณต้องการเปลี่ยนกลับเป็นแผน Standard (ฟรี) ใช่หรือไม่? ฟีเจอร์ Premium จะถูกปิดใช้งานทันที",
      async () => {
        setPlanLoading(true);
        try {
          const res = await fetch(`/api/shop/${isPremium ? "upgrade" : "downgrade"}`, { method: "PATCH" });
          const json = await res.json();
          if (res.ok) {
            setData(prev => prev?.shop ? { ...prev, shop: { ...prev.shop, plan: json.data.plan, planExpiredAt: json.data.planExpiredAt } } : prev);
            showAlert("success", "เปลี่ยนแผนสำเร็จ", `ร้านของคุณอยู่ในแผน ${isPremium ? "Premium Vision" : "Standard"} แล้ว`);
          } else {
            showAlert("error", "เกิดข้อผิดพลาด", json.error || "กรุณาลองใหม่อีกครั้ง");
          }
        } catch {
          showAlert("error", "เชื่อมต่อล้มเหลว", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        } finally {
          setPlanLoading(false);
        }
      }
    );
  };

  // 5. Delete Shop
  const handleDeleteShopTrigger = () => {
    showAlert('critical', 'ลบร้านค้าถาวร', 'พิมพ์คำว่า "DELETE" เพื่อยืนยัน ข้อมูลทั้งหมดจะหายไปและกู้คืนไม่ได้', async () => {
        await performDeleteShop();
    });
  };

  const performDeleteShop = async () => {
    try {
      const res = await fetch("/api/shop/delete", { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
         // Force session update
         await update();

         showAlert('success', 'ลบร้านค้าสำเร็จ', 'ระบบกำลังพาคุณกลับหน้าหลัก...', () => {
             window.location.href = "/user-info";
         });
      } else {
         showAlert('error', 'ลบไม่สำเร็จ', data.error);
      }
    } catch (error) {
        console.error("Error:", error);
        showAlert('error', 'ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
         <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const isOwner = data?.role === 'OWNER';

  return (
    <div className="space-y-10 max-w-3xl mx-auto p-4 md:p-10 font-sans pb-20">
      
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
           <Store size={28} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">ตั้งค่า</h1>
      </div>

      {/* --- Section 1: Owner Only --- */}
      {isOwner && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
            <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800 dark:text-gray-200">
              <Store size={24} className="text-blue-500" /> ข้อมูลร้านค้า
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ชื่อร้านค้า</label>
                <input 
                  type="text" 
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full p-4 text-lg font-black border-none rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner" 
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">บัญชีรับเงิน (สำหรับพนักงาน)</label>
                <input 
                  type="text" 
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  placeholder="เช่น 123-4-56789-0 กสิกรไทย"
                  className="w-full p-4 text-lg font-black border-none rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner" 
                />
              </div>
              <button 
                onClick={handleSaveShop}
                disabled={saving}
                className="w-full md:w-fit bg-blue-600 text-white font-black text-lg px-10 py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={20} />}
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูลร้าน"}
              </button>
            </div>
          </section>

          {/* Plan Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-gray-800 dark:text-gray-200">
              <Zap size={24} className="text-yellow-500" /> แผนการใช้งาน
            </h3>

            {data?.shop?.plan === "premium" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-full">PREMIUM</span>
                  <div>
                    <p className="font-black text-gray-800 dark:text-white">Premium Vision</p>
                    {data.shop.planExpiredAt && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        หมดอายุ {new Date(data.shop.planExpiredAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-2 text-sm font-bold text-gray-600 dark:text-gray-400 px-1">
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> สแกนได้ไม่จำกัด</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> ตรวจสลิปปลอมขั้นสูง (QR Verify)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> ส่งออกรายงาน Excel</li>
                </ul>
                <button
                  onClick={() => handleChangePlan("free")}
                  disabled={planLoading}
                  className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-slate-700 text-gray-500 font-black text-sm hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {planLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  ดาวน์เกรดเป็น Standard (ฟรี)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <span className="px-3 py-1 bg-gray-400 text-white text-xs font-black rounded-full">FREE</span>
                  <p className="font-black text-gray-800 dark:text-white">Standard</p>
                </div>
                <ul className="space-y-2 text-sm font-bold px-1">
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> สแกนสลิป 15 ครั้ง/นาที</li>
                  <li className="flex items-center gap-2 text-gray-400"><XCircle size={16} className="text-gray-300 shrink-0" /> ตรวจสลิปปลอมขั้นสูง</li>
                  <li className="flex items-center gap-2 text-gray-400"><XCircle size={16} className="text-gray-300 shrink-0" /> สแกนไม่จำกัด</li>
                </ul>
                <button
                  onClick={() => handleChangePlan("premium")}
                  disabled={planLoading}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {planLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  อัปเกรดเป็น Premium Vision — ฿199/เดือน
                </button>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
            <div className="pt-2">
              <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">รหัสสำหรับเชิญพนักงาน (Invitation Code)</label>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl text-2xl font-black text-blue-600 dark:text-blue-400 text-center tracking-[0.3em] shadow-inner font-mono select-all">
                  {data?.shop?.inviteCode || "Loading..."}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(data?.shop?.inviteCode || "");
                    showAlert('success', 'คัดลอกเรียบร้อย', 'รหัสเชิญถูกคัดลอกไปยัง Clipboard แล้ว');
                  }}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 md:py-0 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-80 transition-all"
                >
                  คัดลอก
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- Section 2: General Settings --- */}
      <div className="space-y-8 animate-in fade-in duration-700">
        
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800 dark:text-gray-200">
            <Globe size={24} className="text-orange-500" /> การแสดงผลและภาษา
          </h3>
          <div className="space-y-6">
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all group shadow-inner"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="text-lg font-black text-gray-700 dark:text-gray-200">โหมดกลางคืน (Dark Mode)</span>
              </div>
              <div className={`w-14 h-8 rounded-full relative transition-all duration-300 ${theme === 'dark' ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-lg ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-lg transition-all cursor-default">
                <span className="text-2xl">🇹🇭</span> ภาษาไทย
              </button>
              <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border-4 border-transparent bg-gray-50 dark:bg-slate-800 text-gray-400 font-black text-lg hover:bg-gray-100 transition-all opacity-50 cursor-not-allowed">
                <span className="text-2xl">🇺🇸</span> English
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] shadow-xl border border-red-100 dark:border-red-900/30">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle size={24} /> พื้นที่อันตราย (Danger Zone)
          </h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
             <div>
                <h4 className="text-lg font-black text-gray-800 dark:text-white">
                    {isOwner ? "ลบร้านค้าถาวร" : "ลาออกจากร้านค้า"}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                    {isOwner 
                        ? "ข้อมูลสลิป, พนักงาน และประวัติทั้งหมดจะถูกลบและกู้คืนไม่ได้" 
                        : "คุณจะไม่สามารถเข้าถึงข้อมูลของร้านนี้ได้อีก จนกว่าจะได้รับคำเชิญใหม่"}
                </p>
             </div>
             
             {isOwner ? (
                <button 
                  onClick={handleDeleteShopTrigger}
                  className="whitespace-nowrap px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> ลบร้านค้า
                </button>
             ) : (
                <button 
                  onClick={handleLeaveShopTrigger}
                  className="whitespace-nowrap px-6 py-3 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                   <LogOut size={18} /> ลาออก
                </button>
             )}
          </div>
        </section>

        {/* User Account */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 transition-all">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800 dark:text-gray-200">
            <User size={24} className="text-blue-500" /> บัญชีผู้ใช้
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-5 p-4 mb-4 border-2 border-gray-50 dark:border-slate-800 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-2xl border-4 border-white dark:border-slate-700 shadow-md">
                 {data?.name ? data.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xl font-black text-gray-800 dark:text-white leading-none truncate">{data?.name || "Loading..."}</p>
                <p className="text-sm font-black text-blue-500 uppercase tracking-widest mt-2 italic">{data?.role || "USER"}</p>
              </div>
            </div>

            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-600 hover:text-white px-4 py-5 rounded-2xl w-full justify-center font-black text-lg transition-all active:scale-95 shadow-lg shadow-red-100 dark:shadow-none"
            >
              <LogOut size={24} /> ออกจากระบบ
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
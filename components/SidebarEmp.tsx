// components/SidebarOwner.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, FileText, PieChart, Users, Settings, 
  Menu, X, UserCircle 
} from "lucide-react";

export default function SidebarOwner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [shopName, setShopName] = useState<string>("");

  useEffect(() => {
    if (session) {
      fetch("/api/user").then(res => res.json()).then(data => {
        if (data.shop) setShopName(data.shop.name);
      });
    }
  }, [session]);

  const menuItems = [
    { name: "ภาพรวม", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "รายการสลิป", href: "/dashboard/table", icon: <FileText size={20} /> },
    { name: "สรุปยอดขาย", href: "/dashboard/summary", icon: <PieChart size={20} /> },
    { name: "ตั้งค่า", href: "/dashboard/settings", icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* 1. Mobile Top Bar (เหมือนเดิมเป๊ะ) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 shadow-sm border-b 
      border-gray-100 dark:border-slate-800 flex justify-between items-center transition-colors">
         <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
               <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <div className="flex flex-col min-w-0">
               <span className="font-black text-base text-gray-900 dark:text-white tracking-tight truncate">Slip Vision</span>
               <span className="text-[10px] text-gray-400 font-bold truncate">{shopName || "Owner Panel"}</span>
            </div>
         </div>
         <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition shrink-0">
            {isOpen ? <X size={24} className="text-gray-800 dark:text-gray-200"/> : <Menu size={24} className="text-gray-800 dark:text-gray-200"/>}
         </button>
      </div>

      {/* 2. Sidebar Container (กลับสู่ท่า Flexbox) */}
      <aside className={`
        /* Mobile: Fixed ลอยทับ */
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out shadow-2xl 
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        
        /* ✅ Desktop: Static (ไม่ Fixed) เป็นพี่น้องกับ Main Content */
        md:translate-x-0 md:static md:shadow-none
        
        /* จัด Layout ข้างใน */
        flex flex-col h-full
      `}>
        
        {/* Logo Section (แก้ใหม่: โชว์ทั้งมือถือและ Desktop) */}
        <div className="h-20 flex items-center px-6 border-b border-gray-50 dark:border-slate-800 shrink-0 justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100 dark:shadow-none group-hover:scale-105 transition-transform">
               <div className="w-5 h-5 border-2 border-white rounded-md flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Slip Vision</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">{shopName}</p>
            </div>
          </Link>

          <button 
            onClick={() => setIsOpen(false)} 
            className="md:hidden p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>


        </div>

        {/* Menu Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">พนักงานร้าน</p>

            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} 
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group 
                  ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none" : "text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white"}`}>
                  <span className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"} transition-colors`}>{item.icon}</span>
                  <span className="text-sm font-bold">{item.name}</span>
                </Link>
              );
            })}
        </div>
        
        {/* User Info Section */}
        <div className="p-4 border-t border-gray-50 dark:border-slate-800 shrink-0">
           <Link href="/user-info">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-blue-50 
            dark:hover:bg-slate-800 border border-transparent hover:border-blue-100 dark:hover:border-slate-700 transition-all group">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white 
              font-black shadow-md shrink-0">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <UserCircle size={20} />}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{session?.user?.name}</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate">{shopName}</p>
              </div>
            </div>
          </Link>
        </div>
      </aside>
      
      {/* Overlay (Mobile) */}
      {isOpen && (
        <div 
           className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" 
           onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
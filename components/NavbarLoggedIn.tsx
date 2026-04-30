// components/NavbarLoggedIn.tsx
"use client";

import Link from "next/link";
// import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes"; 
import { useState } from "react";
// ✅ 1. นำเข้า Hook เทพ
import { useMounted } from "@/hooks/use-mounted"; 

import { 
  // LayoutDashboard, 
  // FileText, 
  // PieChart, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  Moon,
  Sun
} from "lucide-react";

export default function NavbarLoggedIn() {
  // const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ✅ 2. ใช้ Hook บรรทัดเดียวจบ! (แทน useState+useEffect แบบเดิม)
  const mounted = useMounted(); 

  // const isActive = (path: string) => pathname === path ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 font-bold" : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800 font-medium";

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 h-20 flex items-center justify-between px-6 md:px-10 transition-colors">
      
      {/* 1. Logo */}
      <Link href="/" className="flex items-center gap-2 cursor-pointer group">
        <div className="bg-blue-600 p-2 rounded-xl group-hover:scale-105 transition-transform">
          <div className="w-5 h-5 border-2 border-white rounded-md flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
        <span className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Slip Vision</span>
      </Link>

      {/* 2. Menu Center (Desktop) */}
      {/* <div className="hidden md:flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-gray-100 dark:border-slate-700">
        <Link href="/dashboard" className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all ${isActive('/dashboard')}`}>
          <LayoutDashboard size={18} /> ภาพรวม
        </Link>
        <Link href="/dashboard/table" className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all ${isActive('/dashboard/table')}`}>
          <FileText size={18} /> รายการสลิป
        </Link>
        <Link href="/dashboard/summary" className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all ${isActive('/dashboard/summary')}`}>
          <PieChart size={18} /> สรุปผล
        </Link>
      </div> */}

      {/* 3. User Profile Right */}
      <div className="relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-900"
        >
          <div className="w-9 h-9 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black shadow-md">
            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-black text-gray-900 dark:text-white leading-none">{session?.user?.name || "User"}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Online</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-40 p-2 animate-in slide-in-from-top-2 overflow-hidden">
              
              <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800 mb-2">
                <p className="text-sm font-black text-gray-900 dark:text-white">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>
              </div>
              
              <Link href="/user-info" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <UserIcon size={18} /> ข้อมูลส่วนตัว
              </Link>

              {/* Toggle Dark Mode */}
              <div className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
                    {/* ใช้ mounted เช็คเพื่อป้องกัน icon กระพริบผิดอัน */}
                    {mounted && theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    <span>โหมดกลางคืน</span>
                  </div>
                  {/* Switch UI */}
                  <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${mounted && theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-3px shadow-sm transition-all duration-200 ${mounted && theme === 'dark' ? 'left-18px' : 'left-3px'}`} />
                  </div>
              </div>
              
              <div className="h-px bg-gray-50 dark:bg-slate-800 my-1 mx-2"></div>

              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut size={18} /> ออกจากระบบ
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
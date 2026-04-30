// components/Navbar.tsx
"use client";

// import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export default function Navbar({ onOpenLogin, onOpenRegister }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 dark:border-slate-800 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-6 md:px-10 transition-all">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="bg-blue-600 p-2 rounded-xl">
          <div className="w-5 h-5 border-2 border-white rounded-md flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
        <span className="text-2xl font-black text-blue-600 tracking-tight dark:text-white">Slip Vision</span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenLogin}
          className="hidden md:flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <LogIn size={18} /> เข้าสู่ระบบ
        </button>
        <button 
          onClick={onOpenRegister}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus size={18} /> สมัครสมาชิก
        </button>
      </div>
    </nav>
  );
}
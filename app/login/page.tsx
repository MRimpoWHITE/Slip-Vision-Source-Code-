// app/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// ✅ เพิ่ม ArrowLeft เข้ามา
import { Loader2, User, Lock, LogIn, ArrowRight, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setIsLoading(false);
    } else {
      router.push("/user-info");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-black/50 w-full max-w-md border border-slate-800 relative z-10 backdrop-blur-xl">
        
        {/* ✅ ปุ่มย้อนกลับหน้าหลัก (เพิ่มตรงนี้) */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 md:top-8 md:left-8 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">หน้าหลัก</span>
        </Link>

        <div className="text-center mb-10 relative mt-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 transform rotate-3 ring-4 ring-slate-900">
            <LogIn className="text-white" size={28} strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back!</h1>
          <p className="text-slate-400 font-medium mt-2">เข้าสู่ระบบ Slip Vision Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm p-4 rounded-2xl text-center font-bold border border-red-500/20 animate-in fade-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-14 pr-4 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-800 transition-all hover:bg-slate-800"
                placeholder="ชื่อผู้ใช้งาน"
                required 
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-4 pl-14 pr-4 font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-slate-800 transition-all hover:bg-slate-800"
                placeholder="รหัสผ่าน"
                required 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors">ลืมรหัสผ่าน?</a>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg hover:shadow-blue-500/20"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>เข้าสู่ระบบ <ArrowRight size={20} strokeWidth={3} /></>}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-slate-500 font-bold text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline transition-all">
              สมัครสมาชิกที่นี่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
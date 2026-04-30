// components/auth/LoginModal.tsx
"use client";

import { useState } from "react";
import { User, Lock, X, LogIn, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        setIsLoading(false);
      } else {
        onClose();
        router.push("/user-info"); 
        router.refresh(); 
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* ✅ เพิ่ม dark:bg-slate-900 dark:border-slate-800 */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 transition-colors">
        
        {/* Header */}
        <div className="bg-gray-900 dark:bg-black p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} className="text-white" />
          </button>
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
             <LogIn className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-black tracking-tighter">เข้าสู่ระบบ</h2>
          <p className="text-gray-400 text-sm mt-2 font-bold">ยินดีต้อนรับกลับสู่ Slip Vision</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-900/50 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">
              ชื่อผู้ใช้ / อีเมล / เบอร์โทร
            </label>
            <div className="mt-2 relative">
              <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Username, อีเมล หรือเบอร์โทรศัพท์" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">รหัสผ่าน</label>
            <div className="mt-2 relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} 
                className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
              />
            </div>
          </div>

          <button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full py-4 bg-gray-900 dark:bg-blue-900 text-white rounded-2xl text-xl font-black shadow-xl hover:bg-black dark:hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed dark:shadow-blue-900/20"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "เข้าสู่ระบบ"}
          </button>

          <p className="text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
            ยังไม่มีบัญชี? <button onClick={onSwitchToRegister} className="text-blue-600 dark:text-blue-400 font-black hover:underline">สมัครสมาชิก</button>
          </p>
        </div>
      </div>
    </div>
  );
}
// components/auth/RegisterModal.tsx
"use client";

import { useState } from "react";
import { User, Mail, Lock, Phone, Calendar, CheckCircle2, Circle, X, Loader2 } from "lucide-react";
import { useAlert } from "@/components/providers/AlertProvider";
// import { useRouter } from "next/navigation";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {

  const { showAlert } = useAlert();

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    gender: "",
    birthDate: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // ฟังก์ชันอัปเดตข้อมูลเมื่อพิมพ์
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // เช็คความปลอดภัยรหัสผ่าน
  const checks = [
    { label: "อย่างน้อย 8 ตัวอักษร", valid: formData.password.length >= 8 },
    { label: "มีอักษรภาษาอังกฤษ (A-Z, a-z)", valid: /[a-zA-Z]/.test(formData.password) },
    { label: "มีตัวเลข (0-9)", valid: /[0-9]/.test(formData.password) },
  ];

  const handleRegister = async () => {
    setError("");
    
    // Validate เบื้องต้น
    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (!checks.every(c => c.valid)) {
      setError("รหัสผ่านไม่ปลอดภัยพอ");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          birthDate: formData.birthDate
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert('success', 'สมัครสมาชิกสำเร็จ', 'กรุณาเข้าสู่ระบบ');
        //alert('สมัครสมาชิกสำเร็จ', 'กรุณาเข้าสู่ระบบ');
        onClose();
        onSwitchToLogin(); // เด้งไปหน้า Login ให้เลย
      } else {
        setError(data.error || "สมัครสมาชิกไม่สำเร็จ");
      }
    } catch (error) {
      console.log("error", error);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* ✅ เพิ่ม dark:bg-slate-900 dark:border-slate-800 */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-white dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 transition-colors">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white relative shrink-0 dark:bg-blue-800">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X size={20} className="text-white" />
          </button>
          <h2 className="text-3xl font-black tracking-tighter">สมัครสมาชิก</h2>
          <p className="text-blue-100 text-sm mt-2 font-bold opacity-80">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน Slip Vision</p>
        </div>

        {/* Scrollable Form */}
        <div className="p-8 space-y-6 overflow-y-auto">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-900/50 text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Username */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">ชื่อผู้ใช้งาน</label>
              <div className="mt-2 relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="username" 
                  onChange={handleChange} 
                  type="text" 
                  placeholder="User123" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

            {/* Email */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">อีเมล</label>
              <div className="mt-2 relative">
                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="email" 
                  onChange={handleChange} 
                  type="email" 
                  placeholder="mail@example.com" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

            {/* Password */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">รหัสผ่าน</label>
              <div className="mt-2 relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="password" 
                  onChange={handleChange} 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1 ml-1">
                {checks.map((check, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[10px] font-bold ${check.valid ? "text-green-500" : "text-gray-400 dark:text-gray-600"}`}>
                    {check.valid ? <CheckCircle2 size={12} /> : <Circle size={12} />} {check.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">ยืนยันรหัสผ่าน</label>
              <div className="mt-2 relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="confirmPassword" 
                  onChange={handleChange} 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

            {/* Fullname */}
            <div className="col-span-2">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">ชื่อ – นามสกุล</label>
              <div className="mt-2 relative">
                <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="name" 
                  onChange={handleChange} 
                  type="text" 
                  placeholder="นายสมชาย ใจดี" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

            {/* Birth Date */}
            <div className="col-span-2 md:col-span-1">
               <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">วันเดือนปีเกิด</label>
               <div className="mt-2 relative">
                  <Calendar className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={20} />
                  <input 
                    name="birthDate" 
                    onChange={handleChange} 
                    type="date" 
                    className="
                      w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 
                      dark:bg-slate-800 text-gray-900 dark:text-white
                      font-bold focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer
                      
                      /* ✅ ท่าไม้ตาย: บังคับกลับสีไอคอนปฏิทินในโหมดมืด */
                      [&::-webkit-calendar-picker-indicator]:dark:invert
                    "
                  />
               </div>
            </div>

             {/* Phone */}
             <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">เบอร์โทรศัพท์</label>
              <div className="mt-2 relative">
                <Phone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  name="phone" 
                  onChange={handleChange} 
                  type="tel" 
                  placeholder="081-234-5678" 
                  className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-12 pr-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>

             {/* Gender */}
             <div className="col-span-2">
               <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">เพศ</label>
               <div className="mt-2 flex gap-4">
                 {['ชาย', 'หญิง', 'อื่นๆ'].map((g) => (
                   <label key={g} className="flex-1 cursor-pointer">
                     <input 
                        type="radio" 
                        name="gender" 
                        value={g} 
                        onChange={handleChange} 
                        className="peer hidden" 
                      />
                      <div className="bg-gray-50 dark:bg-slate-800 text-center py-3 rounded-xl font-bold text-gray-400 peer-checked:bg-blue-600 peer-checked:text-white transition-all shadow-sm">
                        {g}
                      </div>
                   </label>
                 ))}
               </div>
             </div>

          </div>

          <button 
            onClick={handleRegister} 
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 dark:bg-blue-800 text-white rounded-2xl text-xl font-black shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95 mt-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "ยืนยันการสมัครสมาชิก"}
          </button>

          <p className="text-center text-gray-400 dark:text-gray-500 font-bold text-sm">
            มีบัญชีอยู่แล้ว? <button onClick={onSwitchToLogin} className="text-blue-600 dark:text-blue-400 font-black hover:underline">เข้าสู่ระบบเลย</button>
          </p>
        </div>
      </div>
    </div>
  );
}
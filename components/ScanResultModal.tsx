// components/ScanResultModal.tsx
"use client";

import { X, CheckCircle2, Wallet, Calendar, User, Building2 } from "lucide-react";

interface ScanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // รับข้อมูลผลลัพธ์จาก API
}

export default function ScanResultModal({ isOpen, onClose, data }: ScanResultModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Slip Card */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2rem shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-slate-800">
        
        {/* Header Gradient */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg mb-3">
             <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-white font-black text-xl">ตรวจสอบสำเร็จ!</h2>
          <p className="text-blue-100 text-xs font-bold">Slip Vision Verified</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 relative">
          
          {/* Amount */}
          <div className="text-center">
             <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">ยอดเงินโอน</p>
             <div className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
               ฿{data.amount?.toLocaleString() || "0.00"}
             </div>
          </div>

          {/* Divider */}
          <div className="relative h-px bg-gray-100 dark:bg-slate-800 border-t border-dashed border-gray-300 dark:border-slate-700">
             <div className="absolute -left-6 -top-3 w-6 h-6 bg-slate-900/80 rounded-full"></div>
             <div className="absolute -right-6 -top-3 w-6 h-6 bg-slate-900/80 rounded-full"></div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 text-sm">
             <ResultRow icon={<Building2 size={16}/>} label="ธนาคาร" value={data.bank} />
             {/* แปลงวันที่ให้สวยงาม ถ้า API ส่งมาแบบ ISO */}
             <ResultRow icon={<Calendar size={16}/>} label="วัน-เวลา" value={`${data.date} ${data.time}`} />
             <ResultRow icon={<User size={16}/>} label="ผู้โอน" value={data.sender} />
             <ResultRow icon={<User size={16}/>} label="ผู้รับ" value={data.receiver} />
             <ResultRow icon={<Wallet size={16}/>} label="รหัสอ้างอิง" value={data.refNo} isMono />
          </div>

          {/* Actions */}
          <button onClick={onClose} className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black shadow-lg active:scale-95 transition-all">
            ปิดหน้าต่าง
          </button>
        </div>

        {/* Decorative Bottom */}
        <div className="h-3 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      </div>
    </div>
  );
}

// Helper Component สำหรับแถวข้อมูล
function ResultRow({ icon, label, value, isMono = false }: { icon: any, label: string, value: string, isMono?: boolean }) {
  return (
    <div className="flex justify-between items-center group">
       <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 font-bold">
          {icon} <span>{label}</span>
       </div>
       <div className={`font-black text-gray-800 dark:text-gray-200 text-right ${isMono ? "font-mono tracking-tight" : ""}`}>
          {value || "-"}
       </div>
    </div>
  )
}
// components/AlertModal.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Trash2, X, Info, ShieldAlert } from "lucide-react";

// ✅ เพิ่ม type 'critical' เข้าไป
export type AlertType = 'success' | 'error' | 'info' | 'warning' | 'delete' | 'critical';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: (inputValue?: string) => void; // รองรับการส่งค่ากลับ
  isLoading?: boolean;
}

export default function AlertModal({ 
   onClose, type, title, message, onConfirm, isLoading 
}: AlertModalProps) {
  
  const [inputValue, setInputValue] = useState("");

  // Reset input เมื่อเปิดใหม่


  // Config สีและไอคอน
  const getConfig = () => {
    switch (type) {
      case 'success':
        return { icon: <CheckCircle2 size={32} />, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', btn: 'bg-green-600 hover:bg-green-700' };
      case 'error':
        return { icon: <XCircle size={32} />, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', btn: 'bg-red-600 hover:bg-red-700' };
      case 'delete': 
        return { icon: <Trash2 size={32} />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', btn: 'bg-red-600 hover:bg-red-700' };
      case 'critical': // ✅ โหมดอันตราย (ลบร้าน)
        return { icon: <ShieldAlert size={32} />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', btn: 'bg-red-600 hover:bg-red-700' };
      case 'warning':
        return { icon: <AlertTriangle size={32} />, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', btn: 'bg-orange-500 hover:bg-orange-600' };
      default: 
        return { icon: <Info size={32} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', btn: 'bg-blue-600 hover:bg-blue-700' };
    }
  };

  const config = getConfig();
  const isConfirmMode = !!onConfirm; 
  // ✅ ถ้าเป็น critical ต้องพิมพ์ DELETE ให้ถูกก่อน ถึงจะกดได้
  const isDisableConfirm = type === 'critical' && inputValue !== 'DELETE';

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2rem shadow-2xl border border-white/20 p-6 relative animate-in zoom-in-95 duration-200">
        
        {!isLoading && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full ${config.bg} ${config.color} mb-2 shadow-sm`}>
            {config.icon}
          </div>
          
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{message}</p>
          </div>

          {/* ✅ ช่องกรอก (แสดงเฉพาะ type critical) */}
          {type === 'critical' && (
            <div className="w-full pt-2">
               <input 
                 type="text" 
                 placeholder="พิมพ์คำว่า DELETE"
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value.toUpperCase().trim())}
                 className="w-full p-3 text-center font-bold border-2 border-red-100 dark:border-red-900/30 rounded-xl bg-gray-50 dark:bg-slate-800 text-red-600 placeholder:text-red-300 focus:outline-none focus:border-red-500 transition-all uppercase"
               />
            </div>
          )}

          <div className="flex w-full gap-3 pt-4">
            {isConfirmMode && (
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                ยกเลิก
              </button>
            )}
            
            <button 
              onClick={() => {
                if (onConfirm) onConfirm(inputValue);
                if (type !== 'critical') onClose(); // ถ้าไม่ใช่ critical ปิดเลย (critical อาจจะรอ API)
              }}
              disabled={isLoading || isDisableConfirm} // ✅ ล็อกปุ่มถ้ายังไม่พิมพ์ DELETE
              className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${config.btn}`}
            >
              {isLoading ? "กำลังโหลด..." : (type === 'delete' || type === 'critical' ? 'ตกลง' : 'ตกลง')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
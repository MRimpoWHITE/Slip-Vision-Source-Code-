"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";

export default function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
          <KeyRound size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">รหัสเชิญพนักงาน (Invite Code)</p>
          <p className="text-xl font-black tracking-widest text-purple-700 dark:text-purple-300">{code}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all active:scale-95"
      >
        {copied ? <><Check size={14} /> คัดลอกแล้ว</> : <><Copy size={14} /> คัดลอก</>}
      </button>
    </div>
  );
}

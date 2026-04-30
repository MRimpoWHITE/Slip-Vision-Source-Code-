"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCcw, User, Clock, X, Loader2, Trash2 } from "lucide-react";
import { useAlert } from "@/components/providers/AlertProvider";

interface SlipBackup {
  id: number;
  bank: string;
  amount: number;
  date: string;
  time: string;
  sender: string;
  receiver: string;
  refNo: string;
  imageUrl?: string;
}

interface Log {
  id: string;
  createdAt: string;
  actor: { name: string | null; username: string } | null;
  details: SlipBackup;
}

function getBankBadge(bankName: string) {
  const bank = bankName?.toLowerCase() || "";
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
  if (bank.includes("kbank") || bank.includes("กสิกร")) colorClass = "bg-green-100 text-green-700 border-green-200";
  else if (bank.includes("scb") || bank.includes("ไทยพาณิชย์")) colorClass = "bg-purple-100 text-purple-700 border-purple-200";
  else if (bank.includes("bbl") || bank.includes("กรุงเทพ")) colorClass = "bg-blue-100 text-blue-700 border-blue-200";
  else if (bank.includes("ktb") || bank.includes("กรุงไทย")) colorClass = "bg-sky-100 text-sky-700 border-sky-200";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${colorClass}`}>
      {bankName || "Unknown"}
    </span>
  );
}

export default function DeletedLogsTable({ logs }: { logs: Log[] }) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = () => {
    showAlert('delete', 'ล้างถังขยะทั้งหมด', 'รายการที่ถูกลบทั้งหมดและรูปภาพใน Cloud จะถูกลบถาวร ไม่สามารถกู้คืนได้', async () => {
      setClearing(true);
      try {
        const res = await fetch("/api/shop/deleted-logs", { method: "DELETE" });
        if (res.ok) {
          router.refresh();
        } else {
          const data = await res.json();
          showAlert('error', 'เกิดข้อผิดพลาด', data.error || "ลบไม่สำเร็จ");
        }
      } catch {
        showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
      } finally {
        setClearing(false);
      }
    });
  };

  const handleRestore = async (auditLogId: string) => {
    if (!confirm("กู้คืนสลิปนี้กลับมาในระบบ?")) return;
    setRestoringId(auditLogId);
    try {
      const res = await fetch("/api/slips/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditLogId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        showAlert('error', 'กู้คืนไม่สำเร็จ', data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
    } finally {
      setRestoringId(null);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-12 text-center text-gray-400">
        <p className="font-bold">ถังขยะว่างเปล่า (ยังไม่มีใครลบอะไร)</p>
      </div>
    );
  }

  return (
    <>
      {/* Header bar with Clear All button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 dark:border-red-900/30">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{logs.length} รายการในถังขยะ</p>
        <button
          onClick={handleClearAll}
          disabled={clearing}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-500 dark:bg-red-900/20 dark:hover:bg-red-600 text-red-500 hover:text-white dark:text-red-400 dark:hover:text-white text-xs font-black rounded-xl border border-red-200 dark:border-red-800 transition-all disabled:opacity-50"
        >
          {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          ล้างทั้งหมด
        </button>
      </div>

      {/* Image Popup */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setViewImage(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
              <X size={28} />
            </button>
            <img src={viewImage} alt="slip" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="block md:hidden p-4 space-y-3">
        {logs.map((log) => {
          const d = log.details;
          return (
            <div key={log.id} className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black shadow-sm text-red-600">
                    {log.actor?.name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">ลบโดย: {log.actor?.name || "Unknown"}</p>
                    <p className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString("th-TH")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {d?.imageUrl && (
                    <button onClick={() => setViewImage(d.imageUrl!)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                  )}
                  <button onClick={() => handleRestore(log.id)} disabled={restoringId === log.id} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50">
                    {restoringId === log.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  </button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  {getBankBadge(d?.bank || "")}
                  <span className="text-sm font-black text-red-600">฿{(d?.amount || 0).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{d?.date} • {d?.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-red-50/50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wide">วันที่ลบ</th>
              <th className="px-6 py-4 text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wide">ลบโดย</th>
              <th className="px-6 py-4 text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wide">ข้อมูลสลิปที่ถูกลบ</th>
              <th className="px-6 py-4 text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wide text-right">ยอดเงิน</th>
              <th className="px-6 py-4 text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wide text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {logs.map((log) => {
              const d = log.details;
              return (
                <tr key={log.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                      <Clock size={16} className="text-gray-400" />
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs font-black">
                        {log.actor?.name?.[0] || <User size={14} />}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {log.actor?.name || log.actor?.username || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {getBankBadge(d?.bank || "")}
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{d?.date} {d?.time}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">Ref: {d?.refNo || "No Ref"}</div>
                      <div className="text-xs text-gray-500">{d?.sender || "-"} → {d?.receiver || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-base font-black text-red-500">฿{(d?.amount || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d?.imageUrl && (
                        <button
                          onClick={() => setViewImage(d.imageUrl!)}
                          title="ดูรูปสลิป"
                          className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRestore(log.id)}
                        disabled={restoringId === log.id}
                        title="กู้คืนสลิปนี้"
                        className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all disabled:opacity-50"
                      >
                        {restoringId === log.id ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

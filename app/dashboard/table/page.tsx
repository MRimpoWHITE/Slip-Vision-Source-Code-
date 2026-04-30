// app/dashboard/table/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo } from "react";
import SlipUploadButton from '@/components/SlipUploadButton';
import { useAlert } from "@/components/providers/AlertProvider";
import {
  Eye, Edit2, Trash2, Filter, Search,
  ChevronLeft, ChevronRight, Loader2, ScrollText, X, FileSpreadsheet, BadgeCheck
} from 'lucide-react';
import * as XLSX from "xlsx";
import { Toaster, toast } from 'react-hot-toast';

// Type ข้อมูล
type Slip = {
  id: number;
  sender: string | null;
  receiver: string | null;
  amount: number | null;
  bank: string | null;
  date: string | null; 
  time: string | null;
  imageUrl: string | null;
  createdAt: string;
  details: string | null;
  refNo: string | null;
  verified: boolean;
  uploadedBy?: { name: string | null; username: string } | null;
  updatedBy?: { name: string | null; username: string } | null;
};

function formatUploadDate(isoString: string) {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export default function DashboardPage() {

  const [slips, setSlips] = useState<Slip[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [desktopRows, setDesktopRows] = useState(8);
  const [pageInput, setPageInput] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'month' | 'day'>('all');
  const [filterDateField, setFilterDateField] = useState<'slip_date' | 'upload_date'>('slip_date');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [shopPlan, setShopPlan] = useState("free");

  const { showAlert } = useAlert();

  // ตั้งค่าเริ่มต้นเป็นวันนี้
  const [filterValue, setFilterValue] = useState(new Date().toISOString().split('T')[0]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [exportFrom, setExportFrom] = useState(today);
  const [exportTo, setExportTo] = useState(today);
  const [editingSlip, setEditingSlip] = useState<Slip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับเก็บ URL รูปที่จะดู (Pop-up)
  const [viewImage, setViewImage] = useState<string | null>(null);

  // State สำหรับแสดงสถานะการอัปโหลดหลายไฟล์
  const [uploadProgress] = useState("");

  const fetchSlips = useCallback(async () => {
    if (slips.length === 0) setIsLoading(true);
    try {
      let all: Slip[] = [];
      let page = 1;
      while (true) {
        const res = await fetch(`/api/slips?page=${page}`, { cache: "no-store" });
        if (!res.ok) break;
        const data = await res.json();
        all = [...all, ...(data.slips ?? [])];
        if (page >= (data.totalPages ?? 1)) break;
        page++;
      }
      setSlips(all);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Error fetching slips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slips.length]);

  useEffect(() => {
    const updateItemsPerPage = () => setItemsPerPage(window.innerWidth < 768 ? 5 : desktopRows);
    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, [desktopRows]);

  useEffect(() => {
    fetchSlips();
    // Fetch shop plan from user API
    fetch("/api/user")
      .then(r => r.json())
      .then(data => { if (data?.shop?.plan) setShopPlan(data.shop.plan); })
      .catch(() => {});
  }, [fetchSlips]);




  const filteredSlips = useMemo(() => {
    return slips.filter(slip => {
      if (filterType !== 'all') {
        const dateStr = filterDateField === 'slip_date'
          ? slip.date
          : slip.createdAt?.slice(0, 10);
        if (!dateStr) return false;
        if (filterType === 'day' && dateStr !== filterValue) return false;
        if (filterType === 'month' && !dateStr.startsWith(filterValue.slice(0, 7))) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const fields = [slip.refNo, slip.sender, slip.receiver, slip.bank, slip.details, String(slip.amount ?? '')];
        if (!fields.some(v => v?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [slips, filterType, filterValue, filterDateField, search]);

  const totalPages = Math.ceil(filteredSlips.length / itemsPerPage);
  const paginatedSlips = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSlips.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSlips, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterValue, filterDateField, search]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isPageAllSelected = paginatedSlips.length > 0 && paginatedSlips.every(s => selectedIds.has(s.id));

  const toggleSelectPage = () => {
    const pageIds = paginatedSlips.map(s => s.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isPageAllSelected) pageIds.forEach(id => next.delete(id));
      else pageIds.forEach(id => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    showAlert('delete', 'ยืนยันการลบ', `ลบ ${selectedIds.size} รายการที่เลือกใช่หรือไม่?`, async () => {
      try {
        await Promise.all([...selectedIds].map(id => fetch(`/api/slips/${id}`, { method: 'DELETE' })));
        setSelectedIds(new Set());
        fetchSlips();
      } catch (error) {
        console.error("Bulk delete error:", error);
      }
    });
  };

  const handleScanSuccess = async () => {
    toast.success('อัปโหลดและประมวลผลสลิปเรียบร้อย!', {
      position: "top-right",
      duration: 4000,
      style: {
        borderRadius: '12px',
        background: '#2c1f7b',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
      },
    });

    await fetchSlips(); 
  };

  const openEditModal = (slip: Slip) => {
    setEditingSlip(slip);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSlip) return;
    try {
      const res = await fetch(`/api/slips/${editingSlip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSlip),
      });
      if (res.ok) {
        setIsEditOpen(false);
        setEditingSlip(null);
        fetchSlips();
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    showAlert('delete', 'ยืนยันการลบ', 'คุณต้องการลบสลิปนี้ใช่หรือไม่?', async () => {
    try {
      const res = await fetch(`/api/slips/${id}`, { method: "DELETE" });
      
      if (!res.ok) {
         const err = await res.json();
         showAlert('error', 'ลบไม่สำเร็จ', err.error || "เกิดข้อผิดพลาด");
         return;
      }
      fetchSlips();
    } catch (error) {
      console.error("Delete error:", error);
    }
    });
  }

  const handleExportExcel = () => {
    const fromDate = new Date(exportFrom + "T00:00:00");
    const toDate = new Date(exportTo + "T23:59:59");

    const exportSlips = slips.filter((s) => {
      const uploaded = new Date(s.createdAt);
      return uploaded >= fromDate && uploaded <= toDate;
    });

    const rows = exportSlips.map((s) => ({
      "วันที่": s.date || "",
      "เวลา": s.time || "",
      "อัปโหลดเมื่อ": new Date(s.createdAt).toLocaleString("th-TH"),
      "REF NO.": s.refNo || "",
      "ธนาคาร": s.bank || "",
      "ตรวจสอบ (Thunder)": s.verified ? "✓" : "",
      "ผู้โอน": s.sender || "",
      "ผู้รับ": s.receiver || "",
      "ยอดเงิน (฿)": s.amount ?? 0,
      "รายละเอียด": s.details || "",
      "อัปโหลดโดย": s.uploadedBy?.name || s.uploadedBy?.username || "",
      "แก้ไขโดย": s.updatedBy?.name || s.updatedBy?.username || "",
    }));

    if (rows.length === 0) {
      showAlert('info', 'ไม่มีข้อมูล', 'ไม่มีสลิปที่อัปโหลดในช่วงวันที่ที่เลือก');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Slips");
    XLSX.writeFile(wb, `slips_${exportFrom}_to_${exportTo}.xlsx`);
    setIsExportOpen(false);
  };

  const getBankColor = (bankName: string | null) => {
    const bank = bankName?.toLowerCase() || "";
    if (bank.includes("kbank") || bank.includes("กสิกร")) return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400";
    if (bank.includes("scb") || bank.includes("ไทยพาณิชย์")) return "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400";
    if (bank.includes("bbl") || bank.includes("กรุงเทพ")) return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
    if (bank.includes("ktb") || bank.includes("กรุงไทย")) return "bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400";
    return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400";
  };

  return (
    <div className="p-6 md:p-8 bg-gray-50/50 min-h-screen font-sans dark:bg-slate-950 transition-colors">
      <Toaster />
      {/* Wrapper หลัก */}
      <div className="w-full space-y-6 px-2 md:px-4">

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
              <ScrollText className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none dark:text-white">
                รายการสลิปโอนเงิน
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-semibold dark:text-gray-400 flex items-center gap-2">
                {uploadProgress ? (
                  <span className="text-blue-600 animate-pulse font-bold">{uploadProgress}</span>
                ) : (
                  "ตรวจสอบความถูกต้องของรายการโอนเงินทั้งหมด"
                )}
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto transform hover:scale-105 transition-transform">
            <SlipUploadButton onSuccess={handleScanSuccess} plan={shopPlan} />
          </div>
        </div>

        {/* 2. Filter Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <select
                suppressHydrationWarning={true}
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as 'all' | 'month' | 'day');
                  setFilterValue(new Date().toISOString().split('T')[0]);
                }}
                className="bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl py-2.5 pl-12 pr-4 text-sm font-semibold focus:outline-none appearance-none cursor-pointer text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <option value="all">กรองตาม: ทั้งหมด</option>
                <option value="month">รายเดือน</option>
                <option value="day">รายวัน</option>
              </select>
            </div>

            {filterType !== 'all' && (
              <>
                <input
                  type={filterType === 'day' ? 'date' : 'month'}
                  value={filterType === 'month' ? filterValue.slice(0, 7) : filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-gray-50 border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 rounded-xl py-2.5 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 shadow-inner"
                />
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => setFilterDateField('slip_date')}
                    className={`px-3 py-2.5 transition-colors ${filterDateField === 'slip_date' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                  >วันสลิป</button>
                  <button
                    onClick={() => setFilterDateField('upload_date')}
                    className={`px-3 py-2.5 transition-colors ${filterDateField === 'upload_date' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                  >วันอัปโหลด</button>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="ค้นหา refNo, ชื่อ, ธนาคาร..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-gray-50 dark:bg-slate-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500 font-semibold uppercase tracking-widest whitespace-nowrap">
              พบ <span className="text-blue-600 text-base dark:text-blue-400 font-black">{filteredSlips.length}</span> รายการ
            </div>
            <button
              onClick={() => setIsExportOpen(true)}
              disabled={slips.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">เลือกแล้ว {selectedIds.size} รายการ</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
                <Trash2 size={13} /> ลบที่เลือก
              </button>
            </div>
          </div>
        )}

        {/* 3. Main Table Content */}
        <div className="bg-white dark:bg-slate-900 rounded-2rem shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden w-full transition-colors">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={48} />
              <p className="text-gray-400 text-lg font-black italic">กำลังดึงข้อมูลล่าสุด...</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden p-3 space-y-3">
                {paginatedSlips.map((s) => {
                  const isDuplicate = s.details?.includes("[สลิปซ้ำ?]");
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl p-3 shadow-sm border transition-transform active:scale-[0.99] ${
                        isDuplicate
                          ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer shrink-0"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{s.date} • {s.time}</span>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">อัปโหลด {formatUploadDate(s.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getBankColor(s.bank)}`}>
                            {s.bank || "Unknown"}
                          </span>
                          {s.verified && (
                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 dark:text-green-400">
                              <BadgeCheck size={12} /> ตรวจสอบแล้ว
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount + sender/receiver */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs text-gray-600 dark:text-gray-300">จาก: <span className="text-gray-900 dark:text-gray-200 font-bold">{s.sender || "-"}</span></div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">ถึง: <span className="text-gray-900 dark:text-gray-200 font-bold">{s.receiver || "-"}</span></div>
                        </div>
                        <span className="text-xl font-black text-green-600 dark:text-green-400 tracking-tight">฿{s.amount?.toLocaleString()}</span>
                      </div>

                      {/* Ref */}
                      {s.refNo && (
                        <div className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-[10px] text-gray-500 dark:text-gray-400 font-mono mb-2 border border-gray-200 dark:border-slate-600 break-all">
                          <span className="font-bold select-none">REF:</span> {s.refNo}
                        </div>
                      )}

                      {/* Notes + actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                        <div className={`text-[10px] font-semibold truncate max-w-30 ${isDuplicate ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {s.details || "ไม่มีโน้ต"}
                        </div>
                        <div className="flex gap-1">
                          {s.imageUrl && (
                            <button onClick={() => setViewImage(s.imageUrl)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                              <Eye size={15} />
                            </button>
                          )}
                          <button onClick={() => openEditModal(s)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Uploader */}
                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-1 font-semibold text-gray-500">
                          UP: <span className="text-gray-700 dark:text-gray-300 font-bold">{s.uploadedBy?.name || "-"}</span>
                        </div>
                        {s.updatedBy && (
                          <div className="flex items-center gap-1 font-semibold text-gray-500">
                            Edit: <span className="text-amber-600 dark:text-amber-400 font-bold">{s.updatedBy?.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View (Table) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                      <th className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={isPageAllSelected}
                          onChange={toggleSelectPage}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">วันที่/เวลา</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">อัปโหลดเมื่อ</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide">REF NO.</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide text-center">ธนาคาร</th>
                      {shopPlan !== "free" && <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide text-center">ตรวจสอบ</th>}
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide">ผู้โอน / ผู้รับ</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide text-right">ยอดเงิน</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide">รายละเอียด</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide text-center">จัดการ</th>
                      <th className="px-6 py-4 text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-wide">ผู้ทำรายการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {paginatedSlips.map((s) => {
                      const isDuplicate = s.details?.includes("[สลิปซ้ำ?]");
                      const uploadedAt = formatUploadDate(s.createdAt);
                      return (
                        <tr
                          key={s.id}
                          className={`transition-all group duration-150 ${
                            isDuplicate
                              ? "bg-yellow-50/60 hover:bg-yellow-100/80 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/20"
                              : "hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
                          }`}
                        >
                          <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-bold text-gray-800 dark:text-gray-200 leading-none">{s.date || "-"}</div>
                            <div className="text-xs text-gray-400 font-medium mt-1">{s.time || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700">
                              {uploadedAt}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 whitespace-nowrap inline-block">
                              {s.refNo || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`text-xs font-black px-3 py-2 rounded-full border tracking-wide uppercase inline-block ${getBankColor(s.bank)}`}>
                              {s.bank || "UNKNOWN"}
                            </span>
                          </td>
                          {shopPlan !== "free" && (
                            <td className="px-6 py-4 text-center">
                              {s.verified ? (
                                <span title="ตรวจสอบด้วย Thunder API แล้ว" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-block w-6 h-6" />
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 min-w-280px">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">จาก: <span className="text-gray-900 dark:text-gray-100 font-bold">{s.sender || "-"}</span></div>
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">ถึง: <span className="text-gray-900 dark:text-gray-100 font-bold">{s.receiver || "-"}</span></div>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className="text-lg font-black text-green-600 dark:text-green-400 tracking-tight">
                              ฿{s.amount?.toLocaleString() || "0"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs font-bold block max-w-250px truncate cursor-help ${
                                isDuplicate ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"
                              }`}
                              title={s.details || ""}
                            >
                                {s.details || "-"}
                            </span>
                          </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                            {s.imageUrl && (
                              <button
                                onClick={() => setViewImage(s.imageUrl)}
                                className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                              >
                                <Eye size={18} />
                              </button>
                            )}
                            <button onClick={() => openEditModal(s)} className="p-2 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all">
                              <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                               <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold border border-blue-200 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-300">UP</span>
                               {s.uploadedBy?.name || s.uploadedBy?.username || "-"}
                            </div>
                            {s.updatedBy && (
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-300">ED</span>
                                  {s.updatedBy?.name || s.updatedBy?.username}
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {!isLoading && filteredSlips.length > 0 && (
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-slate-800 flex flex-row flex-wrap justify-center items-center gap-3 bg-gray-50/50 dark:bg-slate-900/50 text-sm relative">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 rounded-lg transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} /> ก่อนหน้า
              </button>
              <div className="flex items-center gap-1.5 font-bold text-gray-500">
                <span className="hidden sm:inline">หน้า</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pageInput}
                  onFocus={() => setPageInput(String(currentPage))}
                  onChange={e => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={() => {
                    const v = Math.min(totalPages, Math.max(1, Number(pageInput) || 1));
                    setCurrentPage(v);
                    setPageInput("");
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  placeholder={String(currentPage)}
                  className="w-14 text-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-1.5 text-base font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>/ {totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow hover:border-blue-200 transition-all disabled:opacity-30"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
              <div className="hidden md:flex items-center gap-2 md:absolute md:right-6 text-sm">
                <span className="text-gray-500 font-semibold">แสดง</span>
                <select
                  value={desktopRows}
                  onChange={e => { setDesktopRows(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {[8, 14, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-gray-500 font-semibold">บรรทัด</span>
              </div>
            </div>
          )}
        </div>

      </div> {/* End Wrapper */}

      {/* Modal แก้ไข */}
      {isEditOpen && editingSlip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-black mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Edit2 size={20} className="text-blue-600 dark:text-blue-400" /> แก้ไขข้อมูลสลิป
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ธนาคาร</label>
                <input className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.bank || ""} onChange={(e) => setEditingSlip({ ...editingSlip, bank: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ยอดเงิน</label>
                <input type="number" className="w-full mt-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-base font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.amount || 0} onChange={(e) => setEditingSlip({ ...editingSlip, amount: parseFloat(e.target.value) })} />
              </div>
              <div className="col-span-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">วันที่</label><input type="date" className="w-full mt-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.date || ""} onChange={(e) => setEditingSlip({ ...editingSlip, date: e.target.value })} /></div>
              <div className="col-span-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เวลา</label><input type="time" className="w-full mt-1 bg-gray-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.time || ""} onChange={(e) => setEditingSlip({ ...editingSlip, time: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ผู้โอน</label><input className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border-none rounded-xl py-2 px-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.sender || ""} onChange={(e) => setEditingSlip({ ...editingSlip, sender: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ผู้รับ</label><input className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border-none rounded-xl py-2 px-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.receiver || ""} onChange={(e) => setEditingSlip({ ...editingSlip, receiver: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">รายละเอียด (Note)</label><input className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border-none rounded-xl py-2 px-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.details || ""} onChange={(e) => setEditingSlip({ ...editingSlip, details: e.target.value })} /></div>
              <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ref No.</label><input className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-gray-300 border-none rounded-xl py-2 px-3 text-xs font-bold font-mono text-gray-500 focus:ring-2 focus:ring-blue-500 transition-shadow" value={editingSlip.refNo || ""} onChange={(e) => setEditingSlip({ ...editingSlip, refNo: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Excel Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsExportOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <FileSpreadsheet size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">Export Excel</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">กรองตามวันที่อัปโหลด</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={exportTo}
                  min={exportFrom}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full mt-1 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setIsExportOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">ยกเลิก</button>
              <button onClick={handleExportExcel} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-black shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2">
                <FileSpreadsheet size={15} /> โหลด Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Image Modal (Pop-up) */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={() => setViewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all" 
            onClick={() => setViewImage(null)}
          >
            <X size={32} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewImage}
            alt="Slip Preview"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // กดที่รูปแล้วไม่ปิด
          />
        </div>
      )}

    </div>
  );
}
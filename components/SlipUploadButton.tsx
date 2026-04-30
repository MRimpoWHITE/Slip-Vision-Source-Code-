// components/SlipUploadButton.tsx
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createPortal } from "react-dom";
import { Upload, X, Loader2, CheckCircle2, Image as ImageIcon, Plus, Ban } from "lucide-react";

// ฟังก์ชันย่อรูป
import { resizeImage } from "@/utils/resizeImage"; 

interface SlipUploadButtonProps {
  onSuccess: () => void;
  plan: string;
}

export default function SlipUploadButton({ onSuccess, plan }: SlipUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const [mounted, setMounted] = useState(false);
  const [scanMode, setScanMode] = useState<"ocr" | "qr">("ocr");
  const [scanStatus, setScanStatus] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const cancelRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. เพิ่ม State สำหรับจัดการการลากวาง
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCancel = () => {
    cancelRef.current = true;
    abortControllerRef.current?.abort();
    setCancelled(true);
    setScanStatus("ยกเลิกการสแกน...");
  };

  const openModal = () => {
    setFiles([]);
    setProgress({ current: 0, total: 0, success: 0, fail: 0 });
    setScanStatus("");
    setCancelled(false);
    cancelRef.current = false;
    setIsDragging(false);
    setIsOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 2. ฟังก์ชันเพิ่มไฟล์ (Reusable logic)
  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    const uniqueFiles = imageFiles.filter(
      (nf) => !files.some((f) => f.name === nf.name && f.size === nf.size)
    );
    setFiles((prev) => [...prev, ...uniqueFiles]);
  };

  // 3. ฟังก์ชันจัดการ Drag & Drop Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleStartScan = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setCancelled(false);
    cancelRef.current = false;
    setProgress({ current: 0, total: files.length, success: 0, fail: 0 });
    setScanStatus("");

    let sCount = 0;
    let fCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (cancelRef.current) break;

      setProgress((prev) => ({ ...prev, current: i + 1 }));
      setScanStatus(`รูปที่ ${i + 1}/${files.length}: กำลังเตรียมรูปภาพ...`);

      const formData = new FormData();

      try {
        const processedFile = await resizeImage(files[i]);
        const newFileName = files[i].name.replace(/\.[^/.]+$/, "") + ".jpg";
        formData.append("file", processedFile, newFileName);
      } catch (err) {
        console.error("Resize failed, using original file", err);
        formData.append("file", files[i]);
      }

      if (cancelRef.current) break;
      formData.append("mode", plan === "premium" ? scanMode : "ocr");
      setScanStatus(`รูปที่ ${i + 1}/${files.length}: กำลังวิเคราะห์สลิป...`);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        const result = await res.json();
        if (result.success) {
          sCount++;
          setProgress((prev) => ({ ...prev, success: sCount }));
          setScanStatus(`รูปที่ ${i + 1}/${files.length}: เสร็จสิ้น ✓`);
        } else {
          fCount++;
          setProgress((prev) => ({ ...prev, fail: fCount }));
          setScanStatus(`รูปที่ ${i + 1}/${files.length}: ล้มเหลว — ${result.error || "เกิดข้อผิดพลาด"}`);
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          setScanStatus("ยกเลิกการสแกนแล้ว");
          break;
        }
        fCount++;
        setProgress((prev) => ({ ...prev, fail: fCount }));
        setScanStatus(`รูปที่ ${i + 1}/${files.length}: เชื่อมต่อไม่ได้`);
      }
    }

    setUploading(false);
    if (!cancelRef.current) {
      setTimeout(() => {
        setIsOpen(false);
        onSuccess();
      }, 800);
    }
  };

  return (
    <>
      <button onClick={openModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 w-full md:w-auto">
        <Upload size={18} />
        <span>สแกนสลิป</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => !uploading && setIsOpen(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">อัปโหลดสลิป</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">เลือกรูปสลิปที่ต้องการตรวจสอบ</p>
                </div>
                {!uploading && (
                  <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 rounded-full transition-all">
                    <X size={20} />
                  </button>
                )}
              </div>

              {plan === "premium" && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">โหมดสแกน:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 text-[11px] font-black">
                    <button
                      onClick={() => setScanMode("ocr")}
                      disabled={uploading}
                      className={`px-3 py-1.5 transition-colors ${scanMode === "ocr" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
                    >
                      OCR
                    </button>
                    <button
                      onClick={() => setScanMode("qr")}
                      disabled={uploading}
                      className={`px-3 py-1.5 transition-colors ${scanMode === "qr" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
                    >
                      QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Area - รองรับ Drag and Drop */}
            <div 
              className={`p-5 overflow-y-auto flex-1 custom-scrollbar transition-colors ${isDragging ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
                    isDragging 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                      : "border-gray-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                  }`}
                >
                  <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon size={32} className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-black text-gray-700 dark:text-gray-300">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกรูปภาพ</span>
                  <span className="text-xs text-gray-400 mt-1 text-center px-4">รองรับ JPG, PNG, HEIC (เลือกได้ทีละหลายรูป)</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group bg-gray-100 dark:bg-slate-800">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      {!uploading && (
                        <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!uploading && (
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all gap-1 bg-white dark:bg-slate-800/50">
                      <Plus size={20} />
                      <span className="text-[10px] font-bold">เพิ่ม</span>
                    </div>
                  )}
                </div>
              )}

              {(uploading || cancelled) && (
                <div className="mt-6 bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between text-xs font-black text-gray-700 dark:text-gray-200 mb-2">
                    <span className="flex items-center gap-2">
                      {uploading && !cancelled ? <Loader2 className="animate-spin text-blue-500" size={14} /> : <Ban size={14} className="text-red-400" />}
                      {cancelled ? "ยกเลิกแล้ว" : `กำลังสแกน... (${progress.current}/${progress.total})`}
                    </span>
                    <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ease-out ${cancelled ? "bg-red-400" : "bg-blue-600"}`}
                      style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                  {scanStatus && (
                    <p className={`text-[11px] font-bold mt-2 truncate ${cancelled ? "text-red-400" : scanStatus.includes("✓") ? "text-green-600 dark:text-green-400" : scanStatus.includes("ล้มเหลว") ? "text-red-500" : "text-blue-500"}`}>
                      {scanStatus}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/80 flex justify-between items-center shrink-0">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {uploading ? `กำลังประมวลผล ${progress.current}/${progress.total}` : `${files.length} รูปที่เลือก`}
              </div>
              <div className="flex items-center gap-2">
                {uploading && !cancelled && (
                  <button onClick={handleCancel} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black text-red-500 hover:text-white bg-red-50 hover:bg-red-500 dark:bg-red-900/20 transition-all active:scale-95">
                    <Ban size={15} /> ยกเลิก
                  </button>
                )}
                <button
                  onClick={handleStartScan}
                  disabled={files.length === 0 || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 active:scale-95"
                >
                  {uploading ? <><Loader2 size={15} className="animate-spin" /> กำลังสแกน...</> : "เริ่มสแกน"}
                </button>
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
          </div>
        </div>,
        document.body 
      )}
    </>
  );
}
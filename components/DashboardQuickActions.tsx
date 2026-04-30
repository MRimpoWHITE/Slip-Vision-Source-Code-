// components/DashboardQuickAcitons.tsx
"use client";

import { useRouter } from "next/navigation";
// import { useState } from "react";
import SlipUploadButton from "@/components/SlipUploadButton";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast"; 

export default function DashboardQuickActions({ plan }: { plan: string }) {
  const router = useRouter();

  const handleScanSuccess = () => {

    router.refresh(); 


    setTimeout(() => {
    toast.success('บันทึกข้อมูลสลิปด่วนเรียบร้อย!', {
      duration: 3000,
      position: "top-right",
      style: {
        borderRadius: '12px',
        background: '#2c1f7b',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
      },
    });
  }, 600);

  router.refresh(); 
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Card อัปโหลด (ซ้าย) */}
      <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-300 flex flex-col justify-between relative overflow-hidden group dark:shadow-blue-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Zap size={20} className="text-yellow-300" fill="currentColor" />
            </div>
            <h3 className="text-lg font-bold">Quick Upload</h3>
          </div>
          <p className="text-blue-100 text-sm mb-6 max-w-[80%]">
            อัปโหลดสลิปด่วน! ระบบจะสแกนและบันทึกข้อมูลให้อัตโนมัติทันที
          </p>
          
          <div className="w-full">
             <SlipUploadButton onSuccess={handleScanSuccess} plan={plan} />
          </div>
        </div>
      </div>

      {/* Card ไปหน้าตาราง (ขวา) */}
      <div className="dark:bg-slate-900 dark:border-slate-800 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-center items-center text-center cursor-pointer relative overflow-hidden">
        <Link href="/dashboard/table" className="absolute inset-0 z-10"></Link>
        <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4 group-hover:scale-110 transition-transform dark:bg-slate-300">
           <ArrowRight size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">จัดการข้อมูลทั้งหมด</h3>
        <p className="text-gray-500 text-sm mt-1 dark:text-white-500">
          ตรวจสอบ แก้ไข และดูประวัติสลิปย้อนหลัง
        </p>
      </div>
    </div>
  );
}
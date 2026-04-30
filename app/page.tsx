// app/page.tsx
"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";

import { useTheme } from "next-themes";

import Link from "next/link";

import { useMounted } from "@/hooks/use-mounted";

import { resizeImage } from "@/utils/resizeImage";



// --- Components เดิม ---

import Navbar from "@/components/Navbar";

import NavbarLoggedIn from "@/components/NavbarLoggedIn";

import LoginModal from "@/components/auth/LoginModal";

import RegisterModal from "@/components/auth/RegisterModal";

import ScanResultModal from "@/components/ScanResultModal";



// --- Icons ---

import {

  ScanLine, ArrowRight, Upload, Loader2, X, CheckCircle2,

  LayoutDashboard, Moon, Sun, ShieldCheck, Zap, BarChart3,

} from "lucide-react";



export default function LandingPage() {

  const { status } = useSession();

  const { theme, setTheme } = useTheme();

  const mounted = useMounted();

 

  // --- State เดิม: Auth Modals ---

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);



  // --- State เดิม: Result Modal ---

  const [scanResult, setScanResult] = useState(null);

  const [isScanResultOpen, setIsScanResultOpen] = useState(false);



  // --- State Demo Scan ---

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [resultText, setResultText] = useState<string>("");

  const [error, setError] = useState<string>("");



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files[0]) {

      const selected = e.target.files[0];

      setFile(selected);

      setPreview(URL.createObjectURL(selected));

      setResultText("");

      setError("");

    }

  };



  const handleDemoScan = async () => {

    if (!file) return;

    setIsLoading(true);

    setError("");



    try {

      const formData = new FormData();

      //formData.append("file", file);

      try {

        const processedFile = await resizeImage(file);

        // เปลี่ยนชื่อไฟล์เป็น .jpg เพื่อความชัวร์

        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

        formData.append("file", processedFile, newFileName);

      } catch (err) {

        console.error("Resize failed, using original file", err);

        formData.append("file", file); // ถ้า error ให้ใช้ไฟล์เดิม

      }



      const res = await fetch("/api/scan/demo", {

        method: "POST",

        body: formData,

      });



      const data = await res.json();

       

      if (data.success) {

        setResultText(data.rawText);

      } else {

        setError(data.error || "สแกนไม่สำเร็จ");

      }

    } catch (err) {

      console.error(err);

      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");

    } finally {

      setIsLoading(false);

    }

  };



  return (

    // ✅ แก้ไข 1 & 2:

    // - เพิ่ม flex flex-col เพื่อคุม layout แนวตั้ง

    // - ใส่ bg-white (Light) และ dark:bg-gradient... (Dark) ให้สลับสีพื้นหลังได้

    <div className="min-h-screen flex flex-col font-sans relative transition-colors duration-500

      bg-gray-50 text-slate-900

      dark:bg-linear-to-br dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 dark:text-white"

    >

     

      {/* Navbar Wrapper: ปรับสีพื้นหลัง Navbar ตามโหมด */}

      <div className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors

        bg-white/80 border-slate-200

        dark:bg-slate-900/0 dark:border-white/5"

      >

        {status === "authenticated" ? (

          <NavbarLoggedIn />

        ) : (

          <Navbar

            onOpenLogin={() => setIsLoginOpen(true)}

            onOpenRegister={() => setIsRegisterOpen(true)}

          />

        )}

      </div>



      {status !== "authenticated" && (

        <>

          <LoginModal

            isOpen={isLoginOpen}

            onClose={() => setIsLoginOpen(false)}

            onSwitchToRegister={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }}

          />

          <RegisterModal

            isOpen={isRegisterOpen}

            onClose={() => setIsRegisterOpen(false)}

            onSwitchToLogin={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }}

          />

        </>

      )}



      <ScanResultModal

          isOpen={isScanResultOpen}

          onClose={() => setIsScanResultOpen(false)}

          data={scanResult}

      />



      {/* ✅ แก้ไข 3: จัดกึ่งกลาง

          - ใช้ flex-grow เพื่อดันเนื้อหาให้เต็มพื้นที่ว่าง

          - ใช้ flex items-center justify-center เพื่อจัด content ให้อยู่กลางจอแนวตั้ง

      */}

      <main className="grow flex flex-col p-6 pt-32 lg:pt-0 relative z-10">

       

        <div className="my-auto max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-16 items-center">

         

          {/* --- ฝั่งซ้าย: Text Content --- */}

          <div className="flex-1 space-y-8 text-center lg:text-left z-10 animate-in slide-in-from-left-10 duration-700">

            {/* Badge: ปรับสีตามโหมด */}

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4

              bg-blue-50 text-blue-600 border border-blue-200

              dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"

            >

              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></span>

              AI Powered OCR Technology

            </div>

           

            {/* H1: ปรับสี Text Gradient */}

            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[0.9] drop-shadow-sm dark:drop-shadow-2xl text-slate-900 dark:text-white">

              จดบันทึกสลิป <br/>

              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">

                ง่ายและแม่นยำ

              </span>

            </h1>

           

            <p className="text-lg font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed

              text-slate-600 dark:text-slate-400"

            >

              ระบบจัดการสลิปโอนเงินสำหรับร้านค้า จัดเก็บยอดเงินอัตโนมัติ

              บันทึกประวัติ และดูสรุปได้ทุกที่ Power By AI Typhpon (OpenThaiGPT)

            </p>

           

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">

              {status === "authenticated" ? (

                <Link href="/dashboard" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/30 dark:shadow-blue-900/50 flex items-center justify-center gap-2 group hover:-translate-y-1 w-full sm:w-auto">

                   <LayoutDashboard size={20} /> ไปที่แดชบอร์ด

                </Link>

              ) : (

                <>

                  <button

                    onClick={() => setIsRegisterOpen(true)}

                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/30 dark:shadow-blue-900/50 flex items-center justify-center gap-2 group hover:-translate-y-1"

                  >

                    เริ่มใช้งานจริง <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />

                  </button>

                  <button

                    onClick={() => setIsLoginOpen(true)}

                    className="px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2

                    bg-white hover:bg-slate-50 text-slate-700 border border-slate-200

                    dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10"

                  >

                    เข้าสู่ระบบ

                  </button>

                </>

              )}

             

              <a href="#demo" className="lg:hidden px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl font-bold text-lg transition-all border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2">

                  ลองเล่น Demo

              </a>

            </div>



            {/* Stats: ปรับเส้นขีดและสี */}

            <div className="pt-8 flex gap-8 justify-center lg:justify-start border-t

              border-slate-200 dark:border-white/5"

            >

               <div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">99%</p>

                  <p className="text-xs text-slate-500 font-bold uppercase">ความแม่นยำ</p>

               </div>

               <div>

                  <p className="text-2xl font-black text-slate-900 dark:text-white">&lt; 10s</p>

                  <p className="text-xs text-slate-500 font-bold uppercase">ประมวลผล</p>

               </div>

            </div>

          </div>



          {/* --- ฝั่งขวา: Interactive Demo (ปรับสี Card) --- */}

          <div id="demo" className="flex-1 w-full max-w-md backdrop-blur-xl rounded-[2.5rem] p-1 shadow-2xl relative group z-10 animate-in slide-in-from-right-10 duration-700 delay-200

            bg-white/50 border border-slate-200

            dark:bg-slate-900/50 dark:border-white/10"

          >

              {/* Gradient Border Effect */}

              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 via-purple-500 to-blue-500 rounded-[2.5rem] opacity-30 group-hover:opacity-100 transition duration-1000 blur-sm"></div>

             

              <div className="rounded-[2.3rem] p-6 h-full relative overflow-hidden

                bg-white dark:bg-slate-900"

              >

                  {/* Decorative Gradient Top */}

                  <div className="absolute top-0 left-0 w-full h-32 pointer-events-none

                    bg-linear-to-b from-blue-50 to-transparent

                    dark:from-blue-500/10 dark:to-transparent"

                  ></div>



                  <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10

                    text-slate-800 dark:text-white"

                  >

                    <Upload className="text-blue-500" size={24} />

                    ทดลองสแกนสลิป (Demo)

                  </h3>



                  {/* Upload Area */}

                  <div className="space-y-4 relative z-10">

                     {!file ? (

                       <label className="border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all gap-4 group/upload

                         border-slate-300 hover:border-blue-500 hover:bg-slate-50

                         dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-slate-800/50"

                       >

                          <div className="p-4 rounded-full transition-all duration-300 shadow-lg

                             bg-white shadow-slate-200 group-hover/upload:scale-110 group-hover/upload:rotate-12

                             dark:bg-slate-800 dark:shadow-none"

                          >

                             <ScanLine size={32} className="text-slate-400 group-hover/upload:text-blue-500" />

                          </div>

                          <div className="text-center">

                            <p className="text-sm font-bold transition-colors

                               text-slate-600 group-hover/upload:text-blue-600

                               dark:text-slate-300 dark:group-hover/upload:text-white"

                            >

                                คลิกเพื่อเลือกรูปสลิป

                            </p>

                            <p className="text-xs text-slate-500 mt-1">รองรับ .jpg, .png, .HEIC</p>

                          </div>

                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                       </label>

                     ) : (

                       <div className="relative rounded-2xl overflow-hidden border group/preview

                          border-slate-200 bg-slate-50

                          dark:border-slate-700 dark:bg-slate-950"

                       >

                          <img src={preview!} alt="Preview" className="w-full h-64 object-contain opacity-80 group-hover/preview:opacity-40 transition-opacity" />

                         

                          <button

                              onClick={() => { setFile(null); setPreview(null); setResultText(""); setError(""); }}

                              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all z-20"

                          >

                            <X size={16} />

                          </button>



                          {!resultText && !isLoading && (

                            <div className="absolute inset-0 flex items-center justify-center">

                                <button

                                  onClick={handleDemoScan}

                                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/30

                                  dark:shadow-blue-900/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"

                                >

                                  <ScanLine size={18} /> เริ่มสแกน AI

                                </button>

                            </div>

                          )}



                          {isLoading && (

                              <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-10

                                bg-white/80 dark:bg-slate-900/80"

                              >

                                  <Loader2 size={48} className="animate-spin text-blue-500 mb-2" />

                                  <p className="text-sm font-bold text-blue-600 dark:text-blue-200 animate-pulse">กำลังแกะข้อมูล...</p>

                              </div>

                          )}

                       </div>

                     )}



                     {error && (

                         <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-2">

                             <X size={14} /> {error}

                         </div>

                     )}



                     {resultText && (

                       <div className="animate-in slide-in-from-bottom-2 fade-in duration-500">

                          <div className="flex items-center justify-between mb-2">

                              <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-wider">

                                 <CheckCircle2 size={14} /> Scan Complete

                              </div>

                              <span className="text-[10px] text-slate-500">Raw Text Result</span>

                          </div>

                          <div className="p-4 rounded-xl border max-h-48 overflow-y-auto custom-scrollbar shadow-inner

                            bg-slate-100 border-slate-200

                            dark:bg-slate-950 dark:border-slate-800"

                          >

                              <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed

                                text-slate-600 dark:text-slate-300"

                              >

                                  {resultText}

                              </pre>

                          </div>

                       </div>

                     )}

                     {/* Feature Icons */}

            <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">

               <FeatureIcon icon={<ShieldCheck/>} label="แม่นยำ" />

               <FeatureIcon icon={<Zap/>} label="รวดเร็ว" />

               <FeatureIcon icon={<BarChart3/>} label="รายงาน" />

            </div>

                  </div>

              </div>

          </div>

        </div>

      </main>

     

      {/* Background Decor (ปรับให้จางลงใน Light Mode) */}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">

         <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse

            bg-blue-300/30 dark:bg-blue-600/20"

         ></div>

         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full blur-[100px]

            bg-purple-300/30 dark:bg-purple-600/10"

         ></div>

      </div>



      {/* Floating Theme Toggle */}

<button 
        className="fixed bottom-8 right-8 z-50 flex items-center gap-4 px-5 py-3 backdrop-blur-xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border transition-all active:scale-90 hover:scale-105 group
          bg-white/90 border-slate-200 text-slate-600
          dark:bg-slate-900/90 dark:border-slate-700 dark:text-gray-200"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {/* ส่วนแสดงไอคอนและข้อความ */}
        <div className="flex items-center gap-2.5 min-w-90px">
           <div className="relative w-5 h-5 flex items-center justify-center">
              {mounted && theme === 'dark' ? 
                <Moon size={18} className="text-blue-400 animate-in zoom-in duration-300" /> : 
                <Sun size={18} className="text-orange-500 animate-in zoom-in duration-300" />
              }
           </div>
           <span className="text-sm font-black tracking-tight whitespace-nowrap">
             โหมด{mounted && theme === 'dark' ? 'มืด' : 'สว่าง'}
           </span>
        </div>
        
        {/* ส่วนรางสวิตช์ (Switch Track) */}
        <div className={`w-11 h-6 rounded-full relative transition-all duration-500 overflow-hidden ${mounted && theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
            {/* วงกลมสีขาวที่วิ่งไปมา */}
            <div 
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out
                ${mounted && theme === 'dark' ? 'left-6' : 'left-1'}`} 
            />
        </div>
      </button>



    </div>

  );

}



function FeatureIcon({ icon, label }: { icon: React.ReactNode, label: string }) {

  return (

    <div className="flex flex-col items-center gap-2">

      <div className="p-3 bg-white dark:bg-slate-800 shadow-md rounded-xl text-blue-600 dark:text-blue-400 border border-gray-50 dark:border-slate-700 transition-colors">

        {icon}

      </div>

      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{label}</span>

    </div>

  );

}
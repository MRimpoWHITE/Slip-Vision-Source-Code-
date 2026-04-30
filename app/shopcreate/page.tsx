"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, Store, Building2, CreditCard, User, ChevronRight, CheckCircle2, XCircle, Lock } from "lucide-react";
import NavbarLoggedIn from "@/components/NavbarLoggedIn";
import { useAlert } from "@/components/providers/AlertProvider";
import { createShopSchema } from "@/lib/validations";

// ======================================================================
// ShopCreateContent - Shop registration page (3 Step Wizard)
// ======================================================================
// Location: app/shopcreate/page.tsx
// Steps:
//   Step 1: Select plan (Standard free / Premium 199)
//   Step 2: Enter shop info (name, bank, account, owner)
//   Step 3: Payment confirmation
// Flow:
//   1. Select plan -> Step 2
//   2. Enter shop info -> API /api/shop/create -> Step 3
//   3. Confirm payment -> delay 3 seconds -> /dashboard
// ======================================================================

function ShopCreateContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for step (1 = select plan, 2 = shop info, 3 = payment)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected plan (free/premium)
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium" | null>(null);

  // Loading state during API call
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Processing state for payment
  const [isProcessing, setIsProcessing] = useState(false);

  // Shop info form data
  const [formData, setFormData] = useState({ name: "", bank: "", accountNo: "", accountName: "" });

  // Select plan -> go to step 2
  const handleSelectPlan = (plan: "free" | "premium") => {
    setSelectedPlan(plan);
    setStep(2);
  };

  // Back from step 2 to step 1
  const handleBackToStep2 = () => {
    setStep(1);
    setFormData({ name: "", bank: "", accountNo: "", accountName: "" });
  };

  // Credit card data (optional, for display purposes)
  const [cardData, setCardData] = useState({ cardNumber: "", cardName: "", expiryMonth: "", expiryYear: "", cvv: "" });

  // Back from step 3 to step 2
  const handleBackToStep1 = () => {
    setStep(2);
    setCardData({ cardNumber: "", cardName: "", expiryMonth: "", expiryYear: "", cvv: "" });
  };

  // Format card number to "1234 5678 9012 3456"
  const maskCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length > 16) return v.slice(0, 16);
    return v.match(/.{1,4}/g)?.join(' ') || v;
  };

  // Submit shop info -> move to step 3 (NO API CALL YET)
  const handleGoToPayment = () => {
    const result = createShopSchema.safeParse({ ...formData, plan: selectedPlan ?? "free" });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        const field = String(e.path[0]);
        if (!errors[field]) errors[field] = e.message;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep(3);
  };

  // Confirm payment -> call API -> move to dashboard
  const handlePayment = async () => {
    // Free plan - skip card validation, go to dashboard
    if (selectedPlan === "free") {
      setLoading(true);
      setIsProcessing(true);

      try {
        // Call API to create shop (free plan)
        const res = await fetch("/api/shop/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, plan: selectedPlan })
        });

        if (res.ok) {
          // API success
          await new Promise(resolve => setTimeout(resolve, 2000));
          setIsProcessing(false);
          router.push("/dashboard");
        } else {
          const data = await res.json();
          showAlert('error', 'เกิดข้อผิดพลาด', data.error || "กรุณาลองใหม่อีกครั้ง");
          setLoading(false);
          setIsProcessing(false);
        }
      } catch (error) {
        showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
        setLoading(false);
        setIsProcessing(false);
      }
      return;
    }

    setLoading(true);
    setIsProcessing(true);

    try {
      // Call API to create shop (premium plan)
      const res = await fetch("/api/shop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, plan: selectedPlan })
      });

      if (res.ok) {
        // API success - simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsProcessing(false);
        router.push("/dashboard");
      } else {
        const data = await res.json();
        showAlert('error', 'เกิดข้อผิดพลาด', data.error || "กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        setIsProcessing(false);
      }
    } catch (error) {
      showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // ตรวจสอบ login (unauthenticated -> redirect /)
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950">
      <NavbarLoggedIn />

      <div className="p-6 md:p-12 pt-24 max-w-4xl mx-auto">
        {/* Step Indicator - show current step */}
        <div className="flex items-center justify-between mb-12 mt-20">
          <div className="flex items-center gap-4 flex-1">
            {/* Step 1 */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white transition-all ${step === 1 ? 'bg-blue-600 scale-100' : 'bg-gray-300 dark:bg-slate-700 scale-90'}`}>
              1
            </div>
            {/* Line between step 1 and 2 */}
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
            {/* Step 2 */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white transition-all ${step === 2 ? 'bg-blue-600 scale-100' : 'bg-gray-300 dark:bg-slate-700 scale-90'}`}>
              2
            </div>
            {/* Line between step 2 and 3 */}
            <div className={`h-1 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
            {/* Step 3 */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white transition-all ${step === 3 ? 'bg-blue-600 scale-100' : 'bg-gray-300 dark:bg-slate-700 scale-90'}`}>
              3
            </div>
          </div>
        </div>

        {/* Card container สำหรับเนื้อหา */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-slate-800 min-h-125">
          {/* STEP 1: เลือกแผน */}
          {step === 1 ? (
            <>
              <h2 className="text-3xl font-black mb-2">เลือกแผนของคุณ</h2>
              <p className="text-gray-400 font-bold mb-12">เลือกแผนที่เหมาะสมกับธุรกิจของคุณ</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Standard Plan (ฟรี) */}
                <div
                  onClick={() => handleSelectPlan("free")}
                  className={`p-8 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan === "free"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:border-blue-600"
                    }`}
                >
                  <h3 className="text-2xl font-black mb-2 dark:text-white">Standard</h3>
                  <p className="text-4xl font-black mb-6 dark:text-white">Free <span className="text-sm font-bold text-gray-400">/เดือน</span></p>
                  <ul className="space-y-3 text-sm font-bold mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={20} /> สแกนสลิป 100 ครั้ง/วัน</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={20} /> จำกัดความไวในการสแกน</li>
                    <li className="flex items-center gap-2 text-gray-400"><XCircle className="text-gray-300" size={20} /> ตรวจสอบสลิปปลอมขั้นสูง</li>
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-black transition-all ${selectedPlan === "free"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                    }`}>
                    {selectedPlan === "free" ? "✓ เลือกแล้ว" : "เลือกแผน"}
                  </button>
                </div>

                {/* Premium Plan */}
                <div
                  onClick={() => handleSelectPlan("premium")}
                  className={`p-8 rounded-2xl border-2 cursor-pointer transition-all relative ${selectedPlan === "premium"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-slate-700 hover:border-blue-600"
                    }`}
                >
                  <div className="absolute top-3 right-3 px-3 py-1 bg-blue-600 rounded-lg text-white text-[10px] font-black">RECOMMENDED</div>
                  <h3 className="text-2xl font-black mb-2 dark:text-white">Premium Vision</h3>
                  <p className="text-4xl font-black mb-6 dark:text-white">฿199 <span className="text-sm font-bold text-blue-300">/เดือน</span></p>
                  <ul className="space-y-3 text-sm font-bold mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-400" size={20} /> สแกนได้ไม่จำกัด</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-400" size={20} /> ระบบตรวจสลิปปลอมขั้นสูง</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="text-blue-400" size={20} /> ส่งออกรายงาน Excel/PDF</li>
                  </ul>
                  <button className={`w-full py-3 rounded-xl font-black transition-all ${selectedPlan === "premium"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                    }`}>
                    {selectedPlan === "premium" ? "✓ เลือกแล้ว" : "เลือกแผน"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
                  disabled={!selectedPlan}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  ถัดไป <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : step === 2 ? (
            <>
              <h2 className="text-3xl font-black mb-2 flex items-center gap-3 dark:text-white">
                <Store className="text-blue-600 dark:text-blue-400" size={32} /> ข้อมูลร้านค้า
              </h2>
              <p className="text-gray-400 font-bold mb-8">แผนที่เลือก: <span className="text-blue-600 font-black">{selectedPlan === "free" ? "Standard (ฟรี)" : "Premium Vision (฿199/เดือน)"}</span></p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div>
                  <ShopInput label="ชื่อร้านค้า" placeholder="ระบุชื่อร้าน" icon={<Store size={18} />} value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors(p => ({ ...p, name: "" })); }} />
                  {fieldErrors.name && <p className="mt-1 ml-1 text-xs font-bold text-red-500">{fieldErrors.name}</p>}
                </div>
                <div>
                  <ShopInput label="ชื่อธนาคาร" placeholder="ระบุชื่อธนาคาร" icon={<Building2 size={18} />} value={formData.bank} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, bank: e.target.value }); setFieldErrors(p => ({ ...p, bank: "" })); }} />
                  {fieldErrors.bank && <p className="mt-1 ml-1 text-xs font-bold text-red-500">{fieldErrors.bank}</p>}
                </div>
                <div>
                  <ShopInput label="เลขบัญชีธนาคาร" placeholder="XXX-X-XXXXX-X" icon={<CreditCard size={18} />} value={formData.accountNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, accountNo: e.target.value }); setFieldErrors(p => ({ ...p, accountNo: "" })); }} />
                  {fieldErrors.accountNo && <p className="mt-1 ml-1 text-xs font-bold text-red-500">{fieldErrors.accountNo}</p>}
                </div>
                <div>
                  <ShopInput label="ชื่อเจ้าของบัญชี" placeholder="ระบุชื่อเจ้าของบัญชี" icon={<User size={18} />} value={formData.accountName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, accountName: e.target.value }); setFieldErrors(p => ({ ...p, accountName: "" })); }} />
                  {fieldErrors.accountName && <p className="mt-1 ml-1 text-xs font-bold text-red-500">{fieldErrors.accountName}</p>}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackToStep2}
                  className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  onClick={handleGoToPayment}
                  disabled={loading}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Loading...
                    </>
                  ) : (
                    <>
                      ถัดไป <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : step === 3 ? (


            <>
              {/* STEP 3: Payment */}
              <h2 className="text-2xl font-black mb-6 dark:text-white">ยืนยันการชำระเงิน</h2>

              {/* Order Details Box */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-slate-700">
                <p className="text-sm font-black text-gray-500 mb-4">Order details</p>
                <div className="flex justify-between text-sm font-bold dark:text-white mb-2">
                  <span>{selectedPlan === "premium" ? "Premium Vision" : "Standard"}</span>
                  <span>{selectedPlan === "premium" ? "฿199" : "ฟรี"}</span>
                </div>
                {selectedPlan === "premium" && (
                  <>
                    <div className="h-px bg-gray-200 dark:bg-slate-600 my-4" />
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Subtotal</span><span>฿199</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>VAT 7%</span><span>฿13.93</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-slate-600 my-4" />
                    <div className="flex justify-between font-black dark:text-white">
                      <span>Total due today</span><span>฿212.93</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method */}
              {selectedPlan === "premium" && (
                <div className="mb-6">
                  <p className="text-sm font-black text-gray-500 mb-4">Payment method</p>

                  <div className="mb-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full name</label>
                    <input type="text" placeholder="ชื่อ-นามสกุล"
                      className="w-full bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
                  </div>

                  <div className="mb-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Card number</label>
                    <div className="relative">
                      <input type="text" placeholder="1234 1234 1234 1234"
                        value={cardData.cardNumber}
                        onChange={(e) => setCardData({ ...cardData, cardNumber: maskCardNumber(e.target.value) })}
                        className="w-full bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-[8px] font-black flex items-center justify-center">VISA</div>
                        <div className="w-8 h-5 bg-red-500 rounded text-white text-[8px] font-black flex items-center justify-center">MC</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Expiration date</label>
                      <input type="text" placeholder="MM / YY"
                        className="w-full bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Security code</label>
                      <div className="relative">
                        <input type="password" placeholder="CVC"
                          className="w-full bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 mt-6">
                <button onClick={handleBackToStep1} className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600">
                  ← ย้อนกลับ
                </button>
                <button onClick={handlePayment} disabled={loading || isProcessing}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {loading || isProcessing ? <><Loader2 className="animate-spin" size={18} /> Processing...</>
                    : <>{selectedPlan === "premium" ? "Subscribe" : "Confirm & Enter"} <ChevronRight size={18} /></>}
                </button>
              </div>
              {/* Processing Progress */}
              {isProcessing && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="animate-spin" size={16} />
                    <p className="text-sm font-black dark:text-white">Processing...</p>
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-pulse" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  </div>
                </div>
              )}
        </>
          ) : null}
      </div>
    </div>
    </div >
  );
}

export default function ShopCreatePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      }
    >
      <ShopCreateContent />
    </Suspense>
  );
}

function ShopInput({ label, placeholder, icon, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</div>
        <input type="text" value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-50 dark:bg-slate-800 p-4 pl-12 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all placeholder:text-gray-500" />
      </div>
    </div>
  );
}

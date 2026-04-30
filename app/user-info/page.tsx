// app/user-info/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import NavbarLoggedIn from "@/components/NavbarLoggedIn";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { useAlert } from "@/components/providers/AlertProvider";

import {
  User, Mail, Phone, Calendar, Edit3, LogOut,
  Store, CreditCard, Building2, UserCheck, ChevronRight, Loader2, UserCircle,
  Moon, Sun, Save, Lock, Briefcase, Trash2, KeyRound, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";

type UserProfile = {
  username: string;
  email: string;
  name: string;
  phone: string | null;
  gender: string | null;
  birthDate: string | null;
  role: string;
  shopId: number | null;
  shop?: {
    id: number;
    name: string;
    inviteCode: string;
  };
};

export default function UserInfoPage() {
  const { status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme(); 
  const mounted = useMounted();
  const { showAlert } = useAlert();

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // ✅ สถานะเปิด/ปิด Modal ลบบัญชี

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans dark:bg-slate-950 transition-colors relative pb-20">
      <NavbarLoggedIn />

      <div className="p-6 md:p-14 pt-28 max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
           <span>หน้าหลัก</span>
           <ChevronRight size={14} />
           <span className="text-blue-600 dark:text-blue-400 font-black">ข้อมูลผู้ใช้งาน</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-slate-800 relative overflow-hidden transition-colors flex flex-col items-center">
              
              {/* ✅ ปุ่มลบบัญชี แบบรูปถังขยะ */}
              <button 
                onClick={() => setIsDeleteOpen(true)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors z-20"
                title="ลบบัญชี"
              >
                <Trash2 size={20} />
              </button>

              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Avatar Section */}
              <div className="relative mb-6">
                <div className="w-40 h-40 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 overflow-hidden">
                    <span className="text-white text-6xl font-black">
                      {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" title="Online" />
              </div>

              {/* Basic Info */}
              <div className="text-center space-y-1 mb-8">
                <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2
                  ${userData.role === 'OWNER' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                    'bg-purple-100 text-purple-600 dark:bg-purple-900/30'}`}>
                  {userData.role}
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">{userData.name}</h1>
                <p className="text-gray-400 font-bold text-base">@{userData.username}</p>
              </div>

              {/* Quick Actions */}
              <div className="w-full space-y-3">
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={18} /> แก้ไขข้อมูลส่วนตัว
                </button>
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })} 
                  className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-2xl text-sm font-black hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> ออกจากระบบ
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Info & Shop */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100 dark:border-slate-800 transition-colors">
              <h3 className="text-2xl font-black mb-8 dark:text-white flex items-center gap-2">
                <UserCircle size={28} className="text-blue-600" /> ข้อมูลโดยละเอียด
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InfoItem icon={<Mail size={22} className="text-blue-500" />} label="อีเมลการติดต่อ" value={userData.email} />
                <InfoItem icon={<Phone size={22} className="text-purple-500" />} label="เบอร์โทรศัพท์" value={userData.phone || "-"} />
                <InfoItem 
                  icon={<Calendar size={22} className="text-orange-500" />} 
                  label="วัน/เดือน/ปีเกิด" 
                  value={userData.birthDate ? new Date(userData.birthDate).toLocaleDateString('th-TH') : "-"} 
                />
                <InfoItem icon={<User size={22} className="text-pink-500" />} label="เพศ" value={userData.gender || "-"} />
              </div>
            </div>

            {/* Shop Section */}
            {userData.shopId ? (
              <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-blue-500/20 transition-colors" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/10 rounded-1.5rem flex items-center justify-center backdrop-blur-xl border border-white/10">
                      <Store size={40} className="text-white" />
                    </div>
                    <div>
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">สังกัดร้านค้าของคุณ</p>
                      <h2 className="text-3xl font-black tracking-tight">{userData.shop?.name}</h2>
                    </div>
                  </div>
                  <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    ไปที่แดชบอร์ด <ChevronRight size={20}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col group hover:border-blue-500/50 transition-all">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl w-fit mb-4 text-blue-600"><Store size={32} /></div>
                  <h2 className="text-2xl font-black mb-2 dark:text-white">สมัครเจ้าของร้าน</h2>
                  <RegisterShopModal onSuccess={fetchUserData} />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col group hover:border-purple-500/50 transition-all">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl w-fit mb-4 text-purple-600"><UserCheck size={32} /></div>
                  <h2 className="text-2xl font-black mb-2 dark:text-white">ร่วมทีมพนักงาน</h2>
                  <JoinStaffModal onSuccess={fetchUserData} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Delete Account Modal (โผล่ตอนกดถังขยะ) */}
      <DeleteAccountModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
      />

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        user={userData}
        onSuccess={fetchUserData} 
      />

      {/* Theme Toggle (Floating) */}
      <div 
  className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-full shadow-2xl border border-gray-200 dark:border-slate-800 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
>
  {/* Icon Section */}
  <div className="flex items-center justify-center w-6 h-6">
    {mounted && theme === 'dark' ? (
      <Moon size={20} className="text-blue-400 animate-in zoom-in duration-300" />
    ) : (
      <Sun size={20} className="text-orange-500 animate-in zoom-in duration-300" />
    )}
  </div>

  {/* Toggle Switch Section */}
  <div className={`w-12 h-7 rounded-full p-1 relative transition-colors duration-500 ${mounted && theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'}`}>
    <div 
      className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out transform ${
        mounted && theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
      }`} 
    />
  </div>
</div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ✅ 3. Delete Account Modal (New! แบบสวยๆ เหมือนสมัครร้าน)
// ----------------------------------------------------------------------
function DeleteAccountModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { showAlert } = useAlert();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passError, setPassError] = useState("");

  const handleDelete = async () => {
    if (!password) {
      setPassError("กรุณากรอกรหัสผ่านเพื่อยืนยัน");
      return;
    }
    setPassError("");

    // ถามเพื่อความแน่ใจอีกรอบด้วย showAlert ตัวเดิม
    showAlert('delete', '⚠️ ยืนยันการลบบัญชีถาวร?', 'ข้อมูลทุกอย่างรวมถึงร้านค้าและสลิปจะถูกลบทิ้งทันทีและไม่สามารถกู้คืนได้ คุณแน่ใจจริงๆ ใช่ไหม?', async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/user", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });

        if (res.ok) {
          signOut({ callbackUrl: "/" });
        } else {
          const data = await res.json();
          showAlert('error', 'รหัสผ่านไม่ถูกต้อง', data.error || "กรุณาตรวจสอบรหัสผ่าน");
        }
      } catch (error) {
        showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
      } finally {
        setLoading(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-white dark:border-slate-800 text-gray-900 dark:text-white">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6 text-red-500">
            <Trash2 size={40} />
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">ลบบัญชีผู้ใช้</h2>
          <p className="text-gray-400 font-bold mb-8 text-sm px-4">กรุณากรอกรหัสผ่านเพื่อยืนยันว่าคุณคือเจ้าของบัญชีจริง</p>
        </div>

        <div className="space-y-6">
          <ShopInput
            label="รหัสผ่านของคุณ"
            placeholder="••••••••"
            icon={<KeyRound size={18} className="text-red-500"/>}
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setPassError(""); }}
          />
          {passError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{passError}</p>}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button 
            onClick={handleDelete} 
            disabled={loading} 
            className="w-full py-4 bg-red-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "ยืนยันการลบบัญชีถาวร"}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-4 text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ======================================================================
// RegisterShopModal - ปุ่ม "เปิดร้านค้าใหม่"
// ======================================================================
// ตำแหน่ง: app/user-info/page.tsx บรรทัด ~331
// หน้าที่: เป็นปุ่มที่ redirect ไป /shopcreate (ไป step 1 เลือกแผน)
// ======================================================================
function RegisterShopModal({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();

  return (
    <>
      {/* ปุ่มเปิดร้านค้าใหม่ - กดแล้วไปหน้า /shopcreate */}
      <button
        onClick={() => router.push("/shopcreate")}
        className="mt-auto py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
      >
        เปิดร้านค้าใหม่ <ChevronRight size={18} />
      </button>
    </>
  );
}

function JoinStaffModal({ onSuccess }: { onSuccess: () => void }) {
  const { showAlert } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', '🎉 เข้าร่วมร้านสำเร็จ!',`ยินดีต้อนรับสู่ร้าน ${data.shopName}`);
        setIsOpen(false);
        onSuccess();
      } else {
        showAlert('error', 'รหัสไม่ถูกต้อง', data.error || "กรุณาตรวจสอบรหัสเชิญ");
      }
    } catch (error) {
      showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="mt-auto py-4 border-2 border-purple-500/30 text-purple-600 dark:text-purple-400 rounded-2xl text-sm font-black hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2">
        เข้าร่วมร้านค้า <ChevronRight size={18} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-white dark:border-slate-800 text-gray-900 dark:text-white">
            <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
              <UserCheck className="text-purple-600 dark:text-purple-400" size={32} /> รหัสร้านค้า
            </h2>
            <input type="text" placeholder="SV-XXXX" value={inviteCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteCode(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-800 rounded-2xl py-5 px-6 text-2xl font-black text-center tracking-widest outline-none shadow-inner" />
            <div className="mt-10 flex flex-col gap-2">
              <button onClick={handleSubmit} disabled={loading} className="py-4 bg-purple-600 text-white rounded-2xl text-sm font-black flex justify-center items-center shadow-xl">
                 {loading ? <Loader2 className="animate-spin" /> : "ยืนยันรหัส"}
              </button>
              <button onClick={() => setIsOpen(false)} className="py-4 text-sm font-black text-gray-400 hover:text-gray-600">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EditProfileModal({ isOpen, onClose, user, onSuccess }: { isOpen: boolean, onClose: () => void, user: UserProfile, onSuccess: () => void }) {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || "",
    gender: user.gender || "อื่นๆ",
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
    currentPassword: "",
    newPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const handleSubmit = async () => {
    if (!formData.currentPassword) { setPwError("กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน"); return; }
    setPwError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) { onSuccess(); onClose(); }
      else { const data = await res.json(); showAlert('error', 'เกิดข้อผิดพลาด', data.error || "กรุณาลองใหม่"); }
    } catch (e) { showAlert('error', 'เชื่อมต่อ Server ไม่ได้', ''); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-800">
        <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-2"><Edit3 size={24} className="text-blue-600" /> แก้ไขโปรไฟล์</h2>
        <div className="space-y-4">
           <ShopInput label="ชื่อ-นามสกุล" icon={<User size={18}/>} placeholder="..." value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
           <ShopInput label="เบอร์โทร" icon={<Phone size={18}/>} placeholder="..." value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">วันเกิด</label>
                 <input type="date" value={formData.birthDate} onChange={(e: any) => setFormData({...formData, birthDate: e.target.value})} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl font-bold dark:text-white outline-none" />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">เพศ</label>
                 <select value={formData.gender} onChange={(e: any) => setFormData({...formData, gender: e.target.value})} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl font-bold dark:text-white outline-none">
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                 </select>
              </div>
           </div>
           <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-4">
              <ShopInput label="รหัสผ่านเดิม" icon={<KeyRound size={18} className="text-orange-500"/>} type="password" placeholder="ยืนยันตัวตน" value={formData.currentPassword} onChange={(e: any) => { setFormData({...formData, currentPassword: e.target.value}); setPwError(""); }} />
              {pwError && <p className="text-red-500 text-xs font-bold ml-1">{pwError}</p>}
              <ShopInput label="รหัสผ่านใหม่" icon={<Lock size={18}/>} type="password" placeholder="หากต้องการเปลี่ยน" value={formData.newPassword} onChange={(e: any) => setFormData({...formData, newPassword: e.target.value})} />
           </div>
        </div>
        <div className="mt-8 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 text-sm font-black text-gray-400">ยกเลิก</button>
           <button onClick={handleSubmit} disabled={loading} className="flex-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl flex justify-center items-center">
              {loading ? <Loader2 className="animate-spin" /> : "บันทึกข้อมูล"}
           </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40 transition-colors">{icon}</div>
      <div>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}

function ShopInput({ label, placeholder, icon, value, onChange, type="text" }: any) {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</div>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-gray-50 dark:bg-slate-800 p-4 pl-12 rounded-2xl font-bold dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all placeholder:text-gray-500" />
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  // User,
  Phone, Mail, Trash2, Loader2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useAlert } from "@/components/providers/AlertProvider";


type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

export default function EmployeeList() {

  const { showAlert } = useAlert();


  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลพนักงาน
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/shop/employees");
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ฟังก์ชันไล่ออก
  const handleRemove = async (id: string, name: string) => {
    showAlert('delete', 'ลบพนักงาน?', `คุณต้องการลบพนักงาน "${name}" ออกจากร้าน?`, async () => {
      try {
        const res = await fetch("/api/shop/employees", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });

        if (res.ok) {
          showAlert('success', 'ลบพนักงานเรียบร้อยแล้ว', '');
          fetchEmployees(); // โหลดข้อมูลใหม่
        } else {
          showAlert('error', 'เกิดข้อผิดพลาด', '');
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert('error', 'เชื่อมต่อ Server ไม่ได้', '');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2rem p-10 text-center border border-dashed border-gray-300 dark:border-slate-700">
        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-gray-400" size={32} />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white">ยังไม่มีพนักงาน</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">ส่งรหัสเชิญ (Invite Code) จากหน้าตั้งค่าให้พนักงานของคุณเพื่อเข้าร่วม</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((emp) => (
        <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-2rem shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group relative overflow-hidden">

          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center font-black text-lg">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white leading-tight">{emp.name}</h3>
                <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">STAFF</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
              <Mail size={16} /> <span className="truncate">{emp.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-medium">
              <Phone size={16} /> <span>{emp.phone || "-"}</span>
            </div>
            <div className="pt-3 border-t border-gray-50 dark:border-slate-800 text-xs text-gray-400 font-bold">
              เข้าร่วมเมื่อ {format(new Date(emp.createdAt), "d MMM yyyy", { locale: th })}
            </div>
          </div>

          {/* ปุ่มลบ (จะโผล่มาเมื่อเอาเมาส์ชี้) */}
          <div
            className="
            absolute top-4 right-4
            opacity-100
            md:group-hover:opacity-100
            transition-opacity"
          >
            <button
              onClick={() => handleRemove(emp.id, emp.name)}
              className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
              title="ไล่ออก"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
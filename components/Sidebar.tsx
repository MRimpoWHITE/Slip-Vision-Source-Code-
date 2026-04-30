// components/Sidebar.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import SidebarOwner from "./SidebarOwner";
import SidebarEmp from "./SidebarEmp";
import { Loader2 } from "lucide-react";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ถ้ายังไม่ Login ไม่ต้องทำอะไร
    if (status !== "authenticated") return;

    // ยิง API เช็ค Role ล่าสุดจาก Database (ชัวร์สุด)
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role); // จะได้ 'OWNER', 'STAFF', หรือ 'USER'
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch role", err);
        setLoading(false);
      });
  }, [status]);

  // 1. ระหว่างโหลด ให้โชว์ว่างๆ หรือ Loading ไปก่อน (ป้องกันเด้งไป Owner ผิดๆ)
  if (status === "loading" || loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 hidden md:flex items-center justify-center">
         <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  // 2. ถ้าเป็น Staff -> ส่ง SidebarEmp
  if (role === "STAFF") return <SidebarEmp />;
  // 3. นอกนั้น (Owner, Admin, หรือ User ทั่วไป) -> ส่ง SidebarOwner
  return <SidebarOwner />;
}

// 
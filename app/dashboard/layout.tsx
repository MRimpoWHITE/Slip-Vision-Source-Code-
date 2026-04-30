// app/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../api/auth/[...nextauth]/route";
import Sidebar from "@/components/Sidebar";
import { AlertProvider } from "@/components/providers/AlertProvider";
import { Toaster } from 'react-hot-toast';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { shopId: true }
  });

  if (!user || !user.shopId) redirect("/user-info");

  return (
    // ✅ 1. Parent: ใช้ h-screen + overflow-hidden เพื่อล็อคหน้าจอไม่ให้เด้ง
    <div className="flex h-dvh bg-gray-50 dark:bg-slate-950 overflow-hidden transition-colors">

      <Sidebar />

      <main className="flex-1 overflow-y-auto relative focus:outline-none">
        {/* Wrapper สำหรับเนื้อหา (เว้นระยะข้างใน) */}
        <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-full">
          <div className="w-full">
            <AlertProvider>
              <Toaster />
              {children}
            </AlertProvider>
          </div>
        </div>
      </main>

    </div>
  );
}
// app/dashboard/employee-info/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { Users } from "lucide-react";
import EmployeeList from "@/components/EmployeeList";
import InviteCodeCard from "@/components/InviteCodeCard";

export default async function EmployeeInfoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, shopId: true },
  });

  if (user?.role !== "OWNER") redirect("/dashboard");

  const shop = user.shopId
    ? await prisma.shop.findUnique({
        where: { id: user.shopId },
        select: { inviteCode: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none">
          <Users size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">ข้อมูลพนักงาน</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm">จัดการรายชื่อพนักงานในร้านของคุณ</p>
        </div>
      </div>

      {/* Invite Code Card */}
      {shop?.inviteCode && <InviteCodeCard code={shop.inviteCode} />}

      {/* Employee List */}
      <EmployeeList />
    </div>
  );
}
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Trash2, AlertCircle, Timer } from "lucide-react";
import DeletedLogsTable from "@/components/DeletedLogsTable";

export default async function DeletedHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, shopId: true },
  });

  if (user?.role !== "OWNER" || !user?.shopId) redirect("/dashboard");

  const rawLogs = await prisma.auditLog.findMany({
    where: { shopId: user.shopId, action: "DELETE" },
    include: { actor: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates for client component
  const logs = rawLogs.map((log) => ({
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    actor: log.actor,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: log.details as any,
  }));

  return (
    <div className="p-4 md:p-6 bg-gray-50/50 min-h-screen font-sans dark:bg-slate-950 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-800">
            <Trash2 size={28} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">รายการที่ถูกลบ</h1>
            <p className="text-sm text-gray-500 font-bold dark:text-gray-400 flex items-center gap-2">
              <AlertCircle size={14} /> ประวัติการลบสลิปย้อนหลัง (เฉพาะเจ้าของร้าน)
            </p>
          </div>
        </div>

        {/* Retention Policy Notice */}
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4">
          <Timer size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
            ข้อมูลทั้งหมดในหน้านี้จะถูกลบออกถาวร โดยอัตโนมัติหลังจาก <span className="underline">7 วัน</span>
          </p>
        </div>

        {/* Table (Client Component) */}
        <div className="bg-white dark:bg-slate-900 rounded-4xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <DeletedLogsTable logs={logs} />
        </div>

      </div>
    </div>
  );
}

// components/SummaryCharts.tsx
"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted"; 

// ✅ แก้ไขตรงนี้: เพิ่มชื่อธนาคารภาษาไทย ให้ครบทุกแบงก์
const BANK_COLORS: { [key: string]: string } = {
  // กสิกร (เขียว)
  "KBank": "#138f2d", 
  "กสิกรไทย": "#138f2d",
  "กสิกร": "#138f2d",

  // ไทยพาณิชย์ (ม่วง)
  "SCB": "#4e2e7f",   
  "ไทยพาณิชย์": "#4e2e7f",

  // กรุงไทย (ฟ้า)
  "Krungthai": "#00a5e5", 
  "กรุงไทย": "#00a5e5",
  "KTB": "#00a5e5",

  // กรุงเทพ (น้ำเงินเข้ม)
  "BBL": "#1e4598",   
  "กรุงเทพ": "#1e4598",

  // ทหารไทยธนชาต (น้ำเงินฟ้า)
  "TTB": "#0056ff",   
  "ทหารไทย": "#0056ff",
  "ทีทีบี": "#0056ff",

  // ออมสิน (ชมพู)
  "GSB": "#eb198d",   
  "ออมสิน": "#eb198d",

  // กรุงศรี (เหลือง)
  "BAY": "#f5ce00",
  "กรุงศรี": "#f5ce00",

  // อื่นๆ (เทา)
  "Unknown": "#9ca3af",
  "ไม่ระบุ": "#9ca3af"
};

const DEFAULT_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface ChartData {
  name: string;
  total?: number;
  value?: number;
}

interface ChartProps {
  lineData: ChartData[];
  pieData: ChartData[];
  viewMode: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 shadow-lg rounded-lg transition-colors">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{label}</p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          ยอดเงิน: ฿{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function SummaryCharts({ lineData, pieData, viewMode }: ChartProps) {
  const { theme } = useTheme();
  const isClient = useMounted();

  const axisColor = theme === 'dark' ? '#94a3b8' : '#6b7280'; 
  const gridColor = theme === 'dark' ? '#334155' : '#e5e7eb'; 

  if (!isClient) return <div className="w-full h-75 bg-gray-50 dark:bg-slate-900 rounded-2xl animate-pulse"></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      {/* 📈 1. Line Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">
          📈 แนวโน้มยอดเงิน ({viewMode === 'daily' ? 'รายชั่วโมง' : 'รายวัน'})
        </h3>
        <div className="h-75 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: axisColor }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: axisColor }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `฿${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 1 }} />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#2563eb" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: theme === 'dark' ? '#1e293b' : '#fff' }}
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🍰 2. Pie Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">🏦 สัดส่วนธนาคาร</h3>
        <div className="h-75 w-full flex justify-center items-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} 
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke={theme === 'dark' ? '#0f172a' : '#fff'}
                >
                  {pieData.map((entry: ChartData, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      // ถ้าชื่อธนาคารตรงกับ Key ใน BANK_COLORS ก็จะใช้สีนั้น ถ้าไม่ตรงก็วนสี Default
                      fill={BANK_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ color: axisColor }} 
                  formatter={(value) => <span style={{ color: axisColor }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="text-gray-400 text-sm">ไม่มีข้อมูลในช่วงนี้</div>
          )}
        </div>
      </div>
    </div>
  );
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";

interface MonthlyData {
  month: string;
  zomatoQty: number;
  swiggyQty: number;
  diningQty: number;
  parcelQty: number;
  totalQty: number;
}

interface DateWiseData {
  date: string;
  zomatoQty: number;
  swiggyQty: number;
  diningQty: number;
  parcelQty: number;
  totalQty: number;
}

interface SalesChartsProps {
  monthlyData: MonthlyData[];
  dateWiseData?: DateWiseData[];
  restaurantSales?: { [key: string]: number };
}

const RESTAURANT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
  "#d946ef", "#ec4899", "#f43f5e"
];

const AREA_COLORS = {
  zomato: "#ef4444",
  swiggy: "#f97316",
  dining: "#3b82f6",
  parcel: "#10b981",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Custom tooltip to show both quantity and value
const CustomMonthlyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{payload[0]?.payload?.month || "Month"}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
        <p className="text-sm font-bold text-gray-700 mt-2 border-t border-gray-200 pt-2">
          Total: {payload.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function SalesCharts({ monthlyData, dateWiseData, restaurantSales = {} }: SalesChartsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Create data for all 12 months (fill missing months with 0)
  const allMonthsData = MONTH_NAMES.map(month => {
    const found = monthlyData.find(d => d.month === month);
    return found || {
      month,
      zomatoQty: 0,
      swiggyQty: 0,
      diningQty: 0,
      parcelQty: 0,
      totalQty: 0,
    };
  });

  // Convert restaurantSales object to array for pie chart
  const restaurantData = Object.entries(restaurantSales || {})
    .map(([name, quantity]) => ({ name, value: quantity }))
    .sort((a, b) => b.value - a.value);

  // Filter date-wise data if a month is selected
  const filteredDateWiseData = selectedMonth && dateWiseData
    ? (() => {
        const monthNum = MONTH_NAMES.indexOf(selectedMonth) + 1;
        const monthPadded = String(monthNum).padStart(2, '0');
        return dateWiseData.filter(d => {
          // dateWiseData has dates in YYYY-MM-DD format
          // Extract the month part and compare
          const dateMonth = d.date.split('-')[1];
          return dateMonth === monthPadded;
        });
      })()
    : dateWiseData;

  return (
    <div className="space-y-6">
      {/* Monthly Sales Quantity Chart - All 12 Months with Stacked Bars */}
      <div className="bg-gray-950/95 rounded-2xl p-8 border border-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-yellow-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Monthly Sales Quantity</h2>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Area-wise sales across all 12 months</p>
          </div>
        </div>

        <div className="w-full h-96 bg-slate-900/50 rounded-xl p-6 border border-gray-800/30">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={allMonthsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="dailySalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#4b5563" vertical={true} opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                label={{ value: 'Qty', angle: -90, position: 'insideLeft', offset: 5, style: { fill: '#9ca3af', fontSize: 11 } }}
              />
              <Tooltip
                content={<CustomMonthlyTooltip />}
                cursor={{ fill: "rgba(168, 85, 247, 0.08)" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "24px", fontSize: 12 }}
                iconType="circle"
                verticalAlign="top"
              />
              <Bar
                dataKey="totalQty"
                fill="url(#dailySalesGradient)"
                name="Daily Sales"
                isAnimationActive={true}
                animationDuration={600}
                radius={[4, 4, 0, 0]}
                onClick={(data: any) => {
                  if (data?.month) {
                    setSelectedMonth(data.month);
                  }
                }}
                cursor="pointer"
              />
              <Line
                type="monotone"
                dataKey="zomatoQty"
                stroke="#a855f7"
                strokeWidth={2.5}
                name="Zomato Trend"
                dot={{ fill: "#a855f7", r: 4.5, strokeWidth: 2, stroke: "#1f2937" }}
                activeDot={{ r: 6.5 }}
                isAnimationActive={true}
                animationDuration={600}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Date-wise Daily Sales Chart */}
      {dateWiseData && dateWiseData.length > 0 && filteredDateWiseData && filteredDateWiseData.length > 0 && (
        <div className="bg-gray-950/95 rounded-2xl border border-gray-800/50 p-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Daily Sales Breakdown
                </h2>
                {selectedMonth && (
                  <p className="text-xs text-yellow-500/80 font-semibold mt-1 uppercase tracking-widest">📅 Filtered by {selectedMonth}</p>
                )}
              </div>
            </div>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-xs font-bold transition hover:border-gray-600"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>

          <div className="w-full h-96 bg-slate-900/50 rounded-xl p-6 border border-gray-800/30">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredDateWiseData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <defs>
                  <linearGradient id="zomatoGradientDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="swiggyGradientDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="diningGradientDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="parcelGradientDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#4b5563" vertical={true} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 10, fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  label={{ value: 'Qty', angle: -90, position: 'insideLeft', offset: 5, style: { fill: '#9ca3af', fontSize: 11 } }}
                />
                <Tooltip
                  content={<CustomMonthlyTooltip />}
                  cursor={{ fill: "rgba(34, 197, 94, 0.1)" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "24px", fontSize: 12 }}
                  iconType="square"
                />
                <Bar
                  dataKey="zomatoQty"
                  stackId="daily"
                  fill="url(#zomatoGradientDaily)"
                  name="Zomato"
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Bar
                  dataKey="swiggyQty"
                  stackId="daily"
                  fill="url(#swiggyGradientDaily)"
                  name="Swiggy"
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Bar
                  dataKey="diningQty"
                  stackId="daily"
                  fill="url(#diningGradientDaily)"
                  name="Dining"
                  isAnimationActive={true}
                  animationDuration={600}
                />
                <Bar
                  dataKey="parcelQty"
                  stackId="daily"
                  fill="url(#parcelGradientDaily)"
                  name="Parcel"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

    </div>
  );
}

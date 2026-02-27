import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
  const [selectedChannels, setSelectedChannels] = useState<{
    zomato: boolean;
    swiggy: boolean;
    dining: boolean;
    parcel: boolean;
  }>({
    zomato: true,
    swiggy: true,
    dining: true,
    parcel: true,
  });

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
    ? dateWiseData.filter(d => d.date.startsWith(selectedMonth))
    : dateWiseData;

  return (
    <div className="space-y-6">
      {/* Monthly Sales Quantity Chart - All 12 Months with Stacked Bars */}
      <div className="bg-gradient-to-r from-orange-900/40 to-orange-800/30 rounded-xl p-6 border border-orange-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Monthly Sales Quantity</h2>
        </div>

        {/* Channel Selection Filter */}
        <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Channels</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "zomato", label: "Zomato", color: "#ef4444" },
              { key: "swiggy", label: "Swiggy", color: "#f97316" },
              { key: "dining", label: "Dining", color: "#3b82f6" },
              { key: "parcel", label: "Parcel", color: "#10b981" },
            ].map((channel) => (
              <button
                key={channel.key}
                onClick={() =>
                  setSelectedChannels((prev) => ({
                    ...prev,
                    [channel.key]: !prev[channel.key as keyof typeof prev],
                  }))
                }
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                  selectedChannels[channel.key as keyof typeof selectedChannels]
                    ? "bg-opacity-80 border-opacity-100 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-500 opacity-50"
                }`}
                style={
                  selectedChannels[channel.key as keyof typeof selectedChannels]
                    ? {
                        backgroundColor: channel.color,
                        borderColor: channel.color,
                      }
                    : undefined
                }
              >
                {channel.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">Area-wise sales across all 12 months</p>

        <div className="w-full h-96 bg-gray-900/30 rounded-lg p-4 border border-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={allMonthsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="zomatoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="swiggyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="diningGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="parcelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={true} />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                tick={{ fill: "#d1d5db", fontSize: 12, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: "#d1d5db", fontSize: 12 }}
                label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fill: '#d1d5db' } }}
              />
              <Tooltip
                content={<CustomMonthlyTooltip />}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", fontSize: 13 }}
                iconType="square"
              />
              {selectedChannels.zomato && (
                <Bar
                  dataKey="zomatoQty"
                  stackId="quantity"
                  fill="url(#zomatoGradient)"
                  name="Zomato"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              )}
              {selectedChannels.swiggy && (
                <Bar
                  dataKey="swiggyQty"
                  stackId="quantity"
                  fill="url(#swiggyGradient)"
                  name="Swiggy"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              )}
              {selectedChannels.dining && (
                <Bar
                  dataKey="diningQty"
                  stackId="quantity"
                  fill="url(#diningGradient)"
                  name="Dining"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              )}
              {selectedChannels.parcel && (
                <Bar
                  dataKey="parcelQty"
                  stackId="quantity"
                  fill="url(#parcelGradient)"
                  name="Parcel"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-orange-900/30 to-orange-800/20 rounded-lg border border-orange-700/40">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-3">📊 Chart Legend</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: AREA_COLORS.zomato }}></div>
              <span className="text-sm text-gray-300 font-medium">Zomato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: AREA_COLORS.swiggy }}></div>
              <span className="text-sm text-gray-300 font-medium">Swiggy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: AREA_COLORS.dining }}></div>
              <span className="text-sm text-gray-300 font-medium">Dining</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: AREA_COLORS.parcel }}></div>
              <span className="text-sm text-gray-300 font-medium">Parcel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date-wise Daily Sales Chart */}
      {dateWiseData && dateWiseData.length > 0 && filteredDateWiseData && filteredDateWiseData.length > 0 && (
        <div className="bg-gradient-to-br from-white via-orange-50/30 to-orange-50 rounded-2xl border border-orange-200/60 p-8 shadow-lg hover:shadow-xl transition">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Daily Sales Breakdown
                </h2>
                {selectedMonth && (
                  <p className="text-sm text-orange-600 font-semibold mt-1">📅 Filtered by {selectedMonth}</p>
                )}
              </div>
            </div>
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth(null)}
                className="px-5 py-2.5 bg-white hover:bg-orange-50 text-orange-700 rounded-lg border border-orange-300 text-sm font-bold transition shadow-md hover:shadow-lg hover:border-orange-400"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-gray-600 mb-6">Daily area-wise sales for {selectedMonth || 'selected period'}</p>

          <div className="w-full bg-white rounded-xl p-6 border border-gray-100 shadow-lg">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={true} />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: "#374151", fontSize: 11, fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: "#374151", fontSize: 12 }}
                  label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fill: '#374151' } }}
                />
                <Tooltip
                  content={<CustomMonthlyTooltip />}
                  cursor={{ fill: "rgba(34, 197, 94, 0.1)" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px", fontSize: 13 }}
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

          {/* Legend Section */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/50">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "#ef4444" }}></div>
              <span className="text-xs font-semibold text-gray-700">Zomato</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "#f97316" }}></div>
              <span className="text-xs font-semibold text-gray-700">Swiggy</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
              <span className="text-xs font-semibold text-gray-700">Dining</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-orange-100 hover:border-orange-300 transition">
              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: "#10b981" }}></div>
              <span className="text-xs font-semibold text-gray-700">Parcel</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

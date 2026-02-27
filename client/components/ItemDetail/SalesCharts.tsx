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
  variations?: {
    zomato: Array<{ name: string; quantity: number; value: number }>;
    swiggy: Array<{ name: string; quantity: number; value: number }>;
    dining: Array<{ name: string; quantity: number; value: number }>;
    parcel: Array<{ name: string; quantity: number; value: number }>;
  };
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
  zomatoData?: any;
  swiggyData?: any;
  diningData?: any;
  parcelData?: any;
  unitType?: string;
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

export default function SalesCharts({ monthlyData, dateWiseData, restaurantSales = {}, unitType = "units" }: SalesChartsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Custom tooltip to show both quantity and value with variations
  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0]?.payload;
      const variations = dataPoint?.variations;

      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 max-w-md">
          <p className="font-bold text-white mb-3">{dataPoint?.month || "Month"}</p>

          {/* Area-wise summary */}
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="text-xs font-medium text-gray-300">
              {entry.name}: {entry.value.toLocaleString()} {unitType}
            </p>
          ))}

          {/* Variation breakdown if available */}
          {variations && (
            <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Variation Breakdown</p>
              {Object.entries(variations).map(([area, vars]: [string, any]) => {
                const areaVars = Array.isArray(vars) ? vars : [];
                if (areaVars.length === 0) return null;

                return (
                  <div key={area} className="ml-2">
                    <p className="text-xs font-semibold text-gray-400 capitalize">{area}:</p>
                    {areaVars.map((v: any, idx: number) => (
                      <div key={idx} className="ml-3 text-xs text-gray-300">
                        <div className="flex justify-between gap-4">
                          <span>{v.name}</span>
                          <span className="font-mono">
                            {v.quantity.toLocaleString()} {unitType}
                            {v.value ? ` (₹${v.value.toLocaleString()})` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs font-bold text-yellow-400 mt-3 border-t border-gray-700 pt-2">
            Total: {payload.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString()} {unitType}
          </p>
        </div>
      );
    }
    return null;
  };

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

      {/* Restaurant Comparison Chart - Donut */}
      {restaurantSales && Object.keys(restaurantSales).length > 0 && (
        <div className="bg-gray-950/95 rounded-2xl border border-gray-800/50 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Restaurant Performance</h2>
              <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest font-semibold">Comparative sales across restaurants</p>
            </div>
          </div>

          {(() => {
            const totalSales = Object.values(restaurantSales as any).reduce((a: number, b: number) => a + b, 0);
            const sortedRestaurants = Object.entries(restaurantSales as any)
              .sort((a, b) => (b[1] as number) - (a[1] as number));
            const topRestaurant = sortedRestaurants[0];
            const topRestaurantPercentage = totalSales > 0 ? ((topRestaurant[1] as number) / totalSales) * 100 : 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donut Chart with Center Info */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-80 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sortedRestaurants.map(([name, value], idx) => ({
                            name,
                            value: value as number,
                            fill: RESTAURANT_COLORS[idx % RESTAURANT_COLORS.length]
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={140}
                          paddingAngle={1.5}
                          dataKey="value"
                        >
                          {sortedRestaurants.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={RESTAURANT_COLORS[idx % RESTAURANT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            padding: "8px 12px"
                          }}
                          formatter={(value: any) => `${(value as number).toLocaleString()} ${unitType}`}
                          labelStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-black text-white">
                          {topRestaurantPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm font-semibold text-gray-400 mt-2">
                          {topRestaurant[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend with Details */}
                <div className="flex flex-col justify-center">
                  <div className="space-y-3">
                    {sortedRestaurants.map(([restaurant, sales], idx) => {
                      const percentage = totalSales > 0 ? ((sales as number) / totalSales) * 100 : 0;
                      const color = RESTAURANT_COLORS[idx % RESTAURANT_COLORS.length];

                      return (
                        <div key={restaurant} className="flex items-center justify-between p-4 bg-gray-900/40 rounded-xl hover:bg-gray-900/70 transition-all border border-gray-800/30">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 shadow-lg"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-sm font-semibold text-gray-100 truncate">
                              {restaurant}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <div className="text-xs text-gray-400 font-medium">
                                {sales.toLocaleString()} {unitType}
                              </div>
                              <div className="text-base font-bold text-white">
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}

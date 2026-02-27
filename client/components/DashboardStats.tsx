import { Users, TrendingUp, Package, Clock } from "lucide-react";

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}

export default function DashboardStats() {
  const stats: StatCard[] = [
    {
      icon: <Users className="w-6 h-6" />,
      label: "Active User",
      value: "46",
      color: "bg-emerald-500",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: "Total Sales",
      value: "49,500",
      subtext: "17 Feb - 23 Feb",
      color: "bg-blue-600",
    },
    {
      icon: <Package className="w-6 h-6" />,
      label: "Total Orders",
      value: "1,234",
      color: "bg-orange-500",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Pending Upload",
      value: "8",
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:shadow-lg hover:shadow-gray-700/50 transition-all duration-300 hover:scale-105">
          {/* Icon with background color */}
          <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white shadow-lg`}>
            {stat.icon}
          </div>

          {/* Label */}
          <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>

          {/* Value */}
          <h3 className="text-white text-3xl font-black mb-2">{stat.value}</h3>

          {/* Subtext if available */}
          {stat.subtext && (
            <p className="text-gray-500 text-xs font-medium">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}

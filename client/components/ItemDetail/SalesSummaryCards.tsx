import { TrendingUp } from "lucide-react";

interface SalesCardProps {
  type: "Zomato" | "Swiggy" | "Dining" | "Parcel";
  totalQuantity: number;
  totalValue: number;
  variations: Array<{
    name: string;
    quantity: number;
    value: number;
  }>;
  saleType?: "QTY" | "KG";
  unitType?: string;
}

const typeColors = {
  Zomato: {
    bg: "from-red-950/50 to-red-900/30",
    border: "border-red-700/50",
    dot: "bg-red-500",
    text: "text-red-400",
    textBright: "text-red-200",
    icon: "text-red-400",
    shadow: "shadow-red-500/20",
    gradient: "from-red-400 to-red-600",
  },
  Swiggy: {
    bg: "from-orange-950/50 to-orange-900/30",
    border: "border-orange-700/50",
    dot: "bg-orange-500",
    text: "text-orange-400",
    textBright: "text-orange-200",
    icon: "text-orange-400",
    shadow: "shadow-orange-500/20",
    gradient: "from-orange-400 to-orange-600",
  },
  Dining: {
    bg: "from-blue-950/50 to-blue-900/30",
    border: "border-blue-700/50",
    dot: "bg-blue-500",
    text: "text-blue-400",
    textBright: "text-blue-200",
    icon: "text-blue-400",
    shadow: "shadow-blue-500/20",
    gradient: "from-blue-400 to-blue-600",
  },
  Parcel: {
    bg: "from-green-950/50 to-green-900/30",
    border: "border-green-700/50",
    dot: "bg-green-500",
    text: "text-green-400",
    textBright: "text-green-200",
    icon: "text-green-400",
    shadow: "shadow-green-500/20",
    gradient: "from-green-400 to-green-600",
  },
};

export function SalesCard({
  type,
  totalQuantity = 0,
  totalValue = 0,
  variations = [],
  saleType = "QTY",
  unitType = "units",
}: SalesCardProps) {
  const colors = typeColors[type];
  const isKG = saleType === "KG";

  // Format quantity based on sale type
  const formatQuantity = (qty: number) => {
    if (isKG) {
      return `${qty.toFixed(2)} KG`;
    }
    return qty.toLocaleString();
  };

  return (
    <div className={`group relative bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-5 xs:p-6 sm:p-8 hover:border-opacity-100 transition-all duration-300 hover:shadow-2xl ${colors.shadow} backdrop-blur-sm overflow-hidden`}>
      {/* Animated background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl -z-10`}></div>

      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-6 xs:mb-8">
        <div className="flex items-center gap-3 xs:gap-4">
          <div className={`p-3 xs:p-4 bg-gradient-to-br ${colors.gradient} rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-6 xs:w-7 h-6 xs:h-7 rounded-full ${colors.dot} opacity-80`}></div>
          </div>
          <div>
            <h3 className={`text-xl xs:text-2xl font-black ${colors.textBright}`}>{type}</h3>
            <p className="text-[10px] xs:text-xs text-gray-500 font-semibold uppercase tracking-wider">Sales Channel</p>
          </div>
        </div>
      </div>

      {/* Main Stats - Larger and clearer */}
      <div className="grid grid-cols-2 gap-4 xs:gap-6 mb-6 xs:mb-8">
        <div className="group/stat p-4 xs:p-5 bg-gray-950/40 rounded-xl border border-gray-800/50 hover:bg-gray-900/50 transition-all">
          <p className="text-[10px] xs:text-xs font-black text-gray-500 uppercase mb-2 xs:mb-3 tracking-wider">
            Total {isKG ? `Qty (${unitType})` : "Qty"}
          </p>
          <p className={`text-2xl xs:text-3xl sm:text-4xl font-black ${colors.text} group-hover/stat:${colors.textBright} transition-colors`}>
            {isKG ? totalQuantity.toFixed(2) : totalQuantity.toLocaleString()}
          </p>
          <p className="text-[11px] xs:text-xs text-gray-500 mt-1">{unitType}</p>
        </div>
        <div className="group/stat p-4 xs:p-5 bg-gray-950/40 rounded-xl border border-gray-800/50 hover:bg-gray-900/50 transition-all">
          <p className="text-[10px] xs:text-xs font-black text-gray-500 uppercase mb-2 xs:mb-3 tracking-wider">
            Total Value
          </p>
          <p className={`text-2xl xs:text-3xl sm:text-4xl font-black ${colors.text} group-hover/stat:${colors.textBright} transition-colors`}>
            ₹{(totalValue ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] xs:text-xs text-gray-500 mt-1">Total</p>
        </div>
      </div>

      {/* Variation Breakdown - Expanded */}
      <div className="border-t border-gray-800/50 pt-5 xs:pt-6">
        <h4 className="text-xs xs:text-sm font-black text-gray-400 uppercase mb-4 xs:mb-5 tracking-wider">Variation Details</h4>
        <div className="space-y-3 xs:space-y-4">
          {variations.length > 0 ? (
            variations.map((variation, idx) => (
              <div key={idx} className="group/var p-3 xs:p-4 bg-gray-950/50 rounded-xl border border-gray-800/30 hover:border-gray-700/60 hover:bg-gray-900/40 transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm xs:text-base font-bold text-gray-100 group-hover/var:text-white transition-colors">
                      {variation.name}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] xs:text-xs text-gray-500 font-semibold uppercase mb-1">Quantity</p>
                    <p className={`text-sm xs:text-base font-bold ${colors.text}`}>
                      {isKG ? variation.quantity.toFixed(2) : variation.quantity.toLocaleString()} {unitType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] xs:text-xs text-gray-500 font-semibold uppercase mb-1">Value</p>
                    <p className={`text-sm xs:text-base font-bold ${colors.text}`}>
                      {variation.value > 0 ? `₹${variation.value.toLocaleString()}` : "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No variation data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SalesSummaryCardsProps {
  zomatoData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  swiggyData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  diningData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  parcelData: {
    quantity: number;
    value: number;
    variations: Array<{ name: string; quantity: number; value: number }>;
  };
  saleType?: "QTY" | "KG";
  unitType?: string;
}

export default function SalesSummaryCards({
  zomatoData,
  swiggyData,
  diningData,
  parcelData,
  saleType = "QTY",
  unitType = "units",
}: SalesSummaryCardsProps) {
  return (
    <div>
      <div className="mb-6 xs:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-emerald-500/30 to-emerald-500/20 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-white tracking-tight">
            Sales Summary by Area
          </h2>
        </div>
        <p className="text-xs xs:text-sm text-gray-500 font-medium uppercase tracking-wider ml-12">Channel-wise sales breakdown and distribution</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xs:gap-5 sm:gap-6">
        <SalesCard
          type="Zomato"
          totalQuantity={zomatoData.quantity}
          totalValue={zomatoData.value}
          variations={zomatoData.variations}
          saleType={saleType}
          unitType={unitType}
        />
        <SalesCard
          type="Swiggy"
          totalQuantity={swiggyData.quantity}
          totalValue={swiggyData.value}
          variations={swiggyData.variations}
          saleType={saleType}
          unitType={unitType}
        />
        <SalesCard
          type="Dining"
          totalQuantity={diningData.quantity}
          totalValue={diningData.value}
          variations={diningData.variations}
          saleType={saleType}
          unitType={unitType}
        />
        <SalesCard
          type="Parcel"
          totalQuantity={parcelData.quantity}
          totalValue={parcelData.value}
          variations={parcelData.variations}
          saleType={saleType}
          unitType={unitType}
        />
      </div>
    </div>
  );
}

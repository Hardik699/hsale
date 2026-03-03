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
    bg: "bg-gradient-to-br from-slate-700/40 to-slate-800/30",
    border: "border-slate-600/40",
    dot: "bg-red-500",
    accent: "text-red-400",
    icon: "text-red-400",
    shadow: "shadow-slate-900/50",
  },
  Swiggy: {
    bg: "bg-gradient-to-br from-slate-700/40 to-slate-800/30",
    border: "border-slate-600/40",
    dot: "bg-orange-500",
    accent: "text-orange-400",
    icon: "text-orange-400",
    shadow: "shadow-slate-900/50",
  },
  Dining: {
    bg: "bg-gradient-to-br from-slate-700/40 to-slate-800/30",
    border: "border-slate-600/40",
    dot: "bg-blue-500",
    accent: "text-blue-400",
    icon: "text-blue-400",
    shadow: "shadow-slate-900/50",
  },
  Parcel: {
    bg: "bg-gradient-to-br from-slate-700/40 to-slate-800/30",
    border: "border-slate-600/40",
    dot: "bg-green-500",
    accent: "text-green-400",
    icon: "text-green-400",
    shadow: "shadow-slate-900/50",
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
    <div className={`group relative ${colors.bg} border ${colors.border} rounded-lg p-5 sm:p-6 hover:border-opacity-80 transition-all duration-300 hover:shadow-lg ${colors.shadow} backdrop-blur-sm overflow-hidden`}>
      {/* Header with Icon */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 bg-slate-600/30 rounded-lg`}>
          <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white">{type}</h3>
      </div>

      {/* Main Stats */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase mb-1 tracking-wide">
            Total Qty
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {isKG ? totalQuantity.toFixed(2) : totalQuantity.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{unitType}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase mb-1 tracking-wide">
            Total Value
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${colors.accent}`}>
            ₹{(totalValue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Variation Breakdown */}
      {variations.length > 0 && (
        <div className="border-t border-slate-600/30 pt-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">Variations</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {variations.map((variation, idx) => (
              <div key={idx} className="p-2 bg-slate-600/15 rounded border border-slate-600/20">
                <p className="text-xs font-medium text-gray-300 mb-1">
                  {variation.name}
                </p>
                <div className="flex justify-between gap-2 text-xs text-gray-400">
                  <span>{isKG ? variation.quantity.toFixed(2) : variation.quantity.toLocaleString()} {unitType}</span>
                  <span className={colors.accent}>₹{variation.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

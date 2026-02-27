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
}

const typeColors = {
  Zomato: {
    bg: "bg-accent-pink/10",
    border: "border-accent-pink/30",
    dot: "bg-accent-pink",
    text: "text-accent-pink",
  },
  Swiggy: {
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/30",
    dot: "bg-accent-orange",
    text: "text-accent-orange",
  },
  Dining: {
    bg: "bg-accent-teal/10",
    border: "border-accent-teal/30",
    dot: "bg-accent-teal",
    text: "text-accent-teal",
  },
  Parcel: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    dot: "bg-primary",
    text: "text-primary",
  },
};

export function SalesCard({
  type,
  totalQuantity = 0,
  totalValue = 0,
  variations = [],
  saleType = "QTY",
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
    <div className={`${colors.bg} border-2 ${colors.border} rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-6`}>
      {/* Header */}
      <div className="flex items-center gap-2 xs:gap-3 mb-3 xs:mb-4">
        <div className={`w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full ${colors.dot}`}></div>
        <h3 className={`text-base xs:text-lg font-bold ${colors.text}`}>{type}</h3>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 xs:gap-4 mb-4 xs:mb-6">
        <div>
          <p className="text-[8px] xs:text-xs font-semibold text-gray-600 uppercase mb-1">
            Sale {isKG ? "Qty (KG)" : "Qty"}
          </p>
          <p className={`text-lg xs:text-xl sm:text-2xl font-bold ${colors.text} truncate`}>
            {formatQuantity(totalQuantity ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-[8px] xs:text-xs font-semibold text-gray-600 uppercase mb-1">
            Sale Value
          </p>
          <p className={`text-lg xs:text-xl sm:text-2xl font-bold ${colors.text} truncate`}>
            ₹{(totalValue ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Variation Breakdown */}
      <div className="border-t-2 border-gray-300 pt-3 xs:pt-4">
        <div className="space-y-2 xs:space-y-3">
          {variations.map((variation, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-1 gap-2">
                <p className="text-xs xs:text-sm font-medium text-gray-800 truncate">
                  {variation.name}
                </p>
                <span className={`text-[9px] xs:text-xs font-semibold ${colors.text} whitespace-nowrap`}>
                  {isKG ? `${variation.quantity.toFixed(2)} KG` : `${variation.quantity} qty`}
                </span>
              </div>
              <p className={`text-xs xs:text-sm font-semibold ${colors.text}`}>
                {variation.quantity > 0 && variation.value > 0
                  ? `₹${variation.value.toLocaleString()}`
                  : "-"}
              </p>
            </div>
          ))}
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
}

export default function SalesSummaryCards({
  zomatoData,
  swiggyData,
  diningData,
  parcelData,
  saleType = "QTY",
}: SalesSummaryCardsProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 xs:mb-4">
        <TrendingUp className="w-4 xs:w-5 h-4 xs:h-5 text-primary" />
        <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900">
          Sales Summary by Area
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6">
        <SalesCard
          type="Zomato"
          totalQuantity={zomatoData.quantity}
          totalValue={zomatoData.value}
          variations={zomatoData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Swiggy"
          totalQuantity={swiggyData.quantity}
          totalValue={swiggyData.value}
          variations={swiggyData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Dining"
          totalQuantity={diningData.quantity}
          totalValue={diningData.value}
          variations={diningData.variations}
          saleType={saleType}
        />
        <SalesCard
          type="Parcel"
          totalQuantity={parcelData.quantity}
          totalValue={parcelData.value}
          variations={parcelData.variations}
          saleType={saleType}
        />
      </div>
    </div>
  );
}

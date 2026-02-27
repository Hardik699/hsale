interface VariationData {
  name: string;
  quantity: number;
  value: number;
}

interface ChannelData {
  quantity: number;
  value: number;
  variations: VariationData[];
}

interface VariationWiseSalesCardsProps {
  zomatoData?: ChannelData;
  swiggyData?: ChannelData;
  diningData?: ChannelData;
  pickupData?: ChannelData; // Maps to parcelData from API
  saleType?: "QTY" | "KG";
}

const channelConfig = {
  Zomato: {
    color: "bg-accent-pink/10 border-accent-pink/30",
    dot: "bg-accent-pink",
    text: "text-accent-pink",
  },
  Swiggy: {
    color: "bg-accent-orange/10 border-accent-orange/30",
    dot: "bg-accent-orange",
    text: "text-accent-orange",
  },
  Dining: {
    color: "bg-accent-teal/10 border-accent-teal/30",
    dot: "bg-accent-teal",
    text: "text-accent-teal",
  },
  Pickup: {
    color: "bg-primary/10 border-primary/30",
    dot: "bg-primary",
    text: "text-primary",
  },
};

function ChannelCard({
  name,
  data,
  saleType = "QTY",
}: {
  name: "Zomato" | "Swiggy" | "Dining" | "Pickup";
  data?: ChannelData;
  saleType?: "QTY" | "KG";
}) {
  const config = channelConfig[name];
  const isKG = saleType === "KG";

  if (!data || !data.variations) {
    return (
      <div className={`${config.color} border-2 rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${config.dot}`}></div>
          <h3 className={`font-bold text-sm ${config.text}`}>{name}</h3>
        </div>
        <div className="space-y-2 text-gray-500 text-xs">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.color} border-2 rounded-lg p-4 hover:border-opacity-50 transition-all`}>
      {/* Channel Name Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${config.dot}`}></div>
        <h3 className={`font-bold text-sm ${config.text}`}>{name}</h3>
      </div>

      {/* Variations List */}
      <div className="space-y-3">
        {data.variations.length > 0 ? (
          data.variations.map((variation, idx) => (
            <div key={idx} className="bg-white/50 rounded p-2 backdrop-blur-sm">
              <div className="flex justify-between items-center gap-2">
                <p className="text-xs font-medium text-gray-800 truncate flex-1">
                  {variation.name}
                </p>
                <div className="text-right">
                  <p className={`text-xs font-bold ${config.text}`}>
                    {isKG
                      ? `${variation.quantity.toFixed(2)} KG`
                      : `${variation.quantity} qty`}
                  </p>
                  <p className="text-[10px] text-gray-600">
                    ₹{variation.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 text-center py-2">No sales</p>
        )}
      </div>

      {/* Total Summary */}
      <div className={`border-t mt-3 pt-3 ${config.color.split(" ")[1]}`}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-semibold text-gray-600 uppercase">Total</span>
          <div className="text-right">
            <p className={`text-xs font-bold ${config.text}`}>
              {isKG
                ? `${data.quantity.toFixed(2)} KG`
                : `${data.quantity.toLocaleString()} qty`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VariationWiseSalesCards({
  zomatoData,
  swiggyData,
  diningData,
  pickupData,
  saleType = "QTY",
}: VariationWiseSalesCardsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white uppercase tracking-wide">
        Variation-wise Sales by Channel
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ChannelCard
          name="Pickup"
          data={pickupData}
          saleType={saleType}
        />
        <ChannelCard
          name="Dining"
          data={diningData}
          saleType={saleType}
        />
        <ChannelCard
          name="Zomato"
          data={zomatoData}
          saleType={saleType}
        />
        <ChannelCard
          name="Swiggy"
          data={swiggyData}
          saleType={saleType}
        />
      </div>
    </div>
  );
}

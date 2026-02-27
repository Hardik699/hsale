import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Edit, RotateCcw, Package, FileText, TrendingUp } from "lucide-react";
import SalesSummaryCards from "@/components/ItemDetail/SalesSummaryCards";
import SalesCharts from "@/components/ItemDetail/SalesCharts";

console.log("📄 ItemDetail module loaded");

// Helper function to calculate auto pricing
const calculateAutoPrices = (basePrice: number) => {
  if (basePrice <= 0) return { Zomato: 0, Swiggy: 0, GS1: 0 };

  // Round to nearest 5
  const roundToNearest5 = (price: number) => {
    return Math.round(price / 5) * 5;
  };

  // Add 15% markup for Zomato and Swiggy
  const priceWith15Percent = basePrice * 1.15;
  const autoPriceZomato = roundToNearest5(priceWith15Percent);
  const autoPriceSwiggy = roundToNearest5(priceWith15Percent);

  // Add 20% markup for GS1
  const priceWith20Percent = basePrice * 1.20;
  const autoPriceGS1 = roundToNearest5(priceWith20Percent);

  return { Zomato: autoPriceZomato, Swiggy: autoPriceSwiggy, GS1: autoPriceGS1 };
};

// Move outside component to prevent recalculation on every render
const getDefaultDateRange = () => {
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  return { start: startDate, end: endDate };
};

export default function ItemDetail() {
  console.log("🎯 ItemDetail component rendering");
  const params = useParams<{ itemId: string }>();
  const itemId = params.itemId;
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "sales">("details");

  // Initialize with default date range (last 365 days) - only once on mount
  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [restaurants, setRestaurants] = useState<string[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Debug logging
  console.log("🔧 ItemDetail mounted, params:", params, "itemId:", itemId);

  // Fetch unique restaurants (non-blocking)
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchRestaurants = async (retryCount = 0) => {
      try {
        if (!isMounted) return;
        if (retryCount === 0) setRestaurantsLoading(true);

        const controller = new AbortController();
        const abortTimeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch("/api/sales/restaurants", {
          signal: controller.signal,
        });

        clearTimeout(abortTimeoutId);
        if (!isMounted) return;

        if (!response.ok) {
          console.warn("⚠️ Failed to fetch restaurants:", response.status);
          if (isMounted) setRestaurants([]);
          return;
        }

        const result = await response.json();
        if (isMounted) {
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setRestaurants(result.data);
            console.log(`📝 Found ${result.data.length} restaurants`);
          } else {
            setRestaurants([]);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn(`⚠️ Restaurant fetch failed (attempt ${retryCount + 1}):`, error);
          // Retry once on network errors
          if (retryCount < 1 && error instanceof TypeError && isMounted) {
            console.log("⏳ Retrying restaurant fetch in 2 seconds...");
            timeoutId = setTimeout(() => fetchRestaurants(retryCount + 1), 2000);
            return;
          }
        }
        if (isMounted) {
          setRestaurants([]);
        }
      } finally {
        if (isMounted && retryCount === 0) {
          setRestaurantsLoading(false);
        }
      }
    };

    fetchRestaurants();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchItem = async (retryCount = 0) => {
      try {
        if (isMounted && retryCount === 0) setLoading(true);
        setError(null);

        console.log(`🔍 Fetching item with ID: "${itemId}" (attempt ${retryCount + 1})`);

        // Fetch all items and find the one we need with timeout
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/items", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ API returned ${response.status}: ${response.statusText}`,
          );
          console.error("Response:", errorText);
          throw new Error(
            `Failed to fetch items: ${response.status} ${response.statusText}`,
          );
        }

        const items = await response.json();

        if (!Array.isArray(items)) {
          console.error(
            "❌ Invalid response format, expected array but got:",
            typeof items,
          );
          throw new Error("Invalid response format from server");
        }

        console.log(`📦 Received ${items.length} items from API`);
        const foundItem = items.find((i: any) => i.itemId === itemId);

        if (!foundItem) {
          console.error(`❌ Item with ID "${itemId}" not found in database`);
          if (isMounted) {
            setError(`Item with ID "${itemId}" not found.`);
            setItem(null);
          }
        } else {
          console.log(`✅ Found item: ${foundItem.itemName}`);
          if (isMounted) setItem(foundItem);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("🚫 Item fetch aborted");
          return;
        }

        console.error(`❌ Error fetching item (attempt ${retryCount + 1}):`, error.message);

        // Retry once if it's a TypeError
        if (retryCount < 1 && error instanceof TypeError && isMounted) {
          console.log("⏳ Retrying item fetch in 2 seconds...");
          setTimeout(() => fetchItem(retryCount + 1), 2000);
          return;
        }

        if (isMounted) {
          setError(error instanceof Error ? error.message : "Failed to fetch item");
          setItem(null);
        }
      } finally {
        if (isMounted && retryCount === 0) setLoading(false);
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
      // We don't abort here to avoid AbortError loops in dev
    };
  }, [itemId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          navigate("/items");
        }
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const handleResetSalesData = async () => {
    try {
      setIsResetting(true);
      const response = await fetch(`/api/sales/item/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${result.message}`);
        setShowResetConfirm(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`❌ Failed to reset data: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to reset sales data:", error);
      alert("❌ Error resetting sales data");
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch real sales data from API
  const [salesData, setSalesData] = useState<any>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    let isCleanup = false;

    const fetchSalesData = async (retryCount = 0) => {
      if (!itemId || !dateRange.start || !dateRange.end) {
        if (isMounted) setSalesData(null);
        return;
      }

      try {
        if (isMounted && retryCount === 0) setSalesLoading(true);
        const url = new URL(
          `/api/sales/item/${itemId}`,
          window.location.origin,
        );
        url.searchParams.set("startDate", dateRange.start);
        url.searchParams.set("endDate", dateRange.end);
        if (selectedRestaurant) {
          url.searchParams.set("restaurant", selectedRestaurant);
        }

        console.log(`🔄 Fetching sales data (attempt ${retryCount + 1}): ${url.toString()}`);

        // Increase timeout to 60 seconds for large datasets
        timeoutId = setTimeout(() => {
          if (!isCleanup) {
            console.warn("⚠️ Sales data fetch timeout after 60 seconds");
            controller.abort();
          }
        }, 60000);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ Sales API returned ${response.status}: ${response.statusText}`,
          );
          console.error("Error details:", errorText);
          return;
        }

        const result = await response.json();
        console.log("✅ Sales data response:", result);

        if (result.success && result.data && isMounted) {
          setSalesData(result.data);
        } else if (!result.success && isMounted) {
          console.warn("⚠️ Sales API returned success=false");
          setSalesData(null);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("🚫 Sales data fetch aborted");
          return;
        }

        console.error(`❌ Error fetching sales data (attempt ${retryCount + 1}):`, error);

        // Retry once if it's a TypeError (Failed to fetch)
        if (retryCount < 1 && error instanceof TypeError && isMounted && !isCleanup) {
          console.log("⏳ Retrying sales data fetch in 2 seconds...");
          setTimeout(() => fetchSalesData(retryCount + 1), 2000);
          return;
        }

        if (isMounted && retryCount > 0) {
          // Only set to null after all retries are exhausted
          setSalesData(null);
          console.warn("⚠️ Failed to fetch sales data after retries. Showing empty state.");
        }
      } finally {
        if (isMounted && retryCount === 0) setSalesLoading(false);
      }
    };

    fetchSalesData();

    // Cleanup function
    return () => {
      isCleanup = true;
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      // Don't abort the controller during cleanup to avoid AbortError
    };
  }, [itemId, dateRange, selectedRestaurant]);

  if (loading) {
    return (
      <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-primary hover:opacity-80 mb-4 sm:mb-6 font-medium text-sm sm:text-base transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-8 text-center">
          <p className="text-gray-500 text-sm sm:text-base">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-primary hover:opacity-80 mb-4 sm:mb-6 font-medium text-sm sm:text-base transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        <div className="bg-white rounded-lg sm:rounded-xl border border-red-200 p-4 sm:p-8">
          <div className="text-red-600 mb-6">
            <p className="font-semibold text-lg">⚠️ Item Not Found</p>
            <p className="text-sm mt-2">{error || "Item not found"}</p>
            <p className="text-xs mt-2 text-red-500 font-mono bg-red-50 p-2 rounded">
              Looking for ID: {itemId}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900 mb-2">
              <strong>Common causes:</strong>
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
              <li>The item might not be properly saved in the database</li>
              <li>MongoDB connection might be failing</li>
              <li>The item ID might have changed</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>What to do:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Open browser console (F12) and check for error messages</li>
              <li>Go back to Items list and create a new item</li>
              <li>Check if MongoDB is accessible and working</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/items")}
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
            >
              Return to Items List
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato", "GS1"];

  return (
    <div className="flex-1 min-h-screen bg-gray-950 p-4 sm:p-6 lg:p-8 space-y-8 no-scrollbar">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-4">
              Reset Sales Data?
            </h2>
            <p className="text-gray-400 mb-6">
              This will permanently delete all sales history for{" "}
              <strong className="text-white">{item?.itemName}</strong>. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSalesData}
                disabled={isResetting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Reset Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button & Header */}
      <div className="flex flex-col gap-6">
        <button
          onClick={() => navigate("/items")}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm transition-all w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Items
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Package className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white capitalize tracking-tight">
                {item.itemName}
              </h1>
              <p className="text-gray-400 font-medium text-sm mt-1 max-w-xl">
                {item.description || "Manage item variations and view sales analytics"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/items/${itemId}/edit`)}
              className="flex-1 sm:flex-none p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2"
              title="Edit item"
            >
              <Edit className="w-5 h-5" />
              <span className="sm:hidden font-bold">Edit</span>
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex-1 sm:flex-none p-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2"
              title="Reset sales data"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="sm:hidden font-bold">Reset</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 sm:flex-none p-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-900/50 transition-all flex items-center justify-center gap-2"
              title="Delete item"
            >
              <Trash2 className="w-5 h-5" />
              <span className="sm:hidden font-bold">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "details", label: "Item Details", color: "bg-blue-600" },
          { id: "sales", label: "Sales Information", color: "bg-emerald-500" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 group relative overflow-hidden ${
                isActive
                  ? `${tab.color} text-white shadow-lg shadow-white/10`
                  : `bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700`
              }`}
            >
              {isActive && <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></div>}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="h-px bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"></div>

      {/* Main Card Container */}
      <div className="overflow-hidden border border-gray-800 rounded-2xl shadow-2xl shadow-blue-500/5 hover:border-blue-600/30 transition-all duration-300">
        {/* Card Header Section */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 sm:px-8 py-6 border-b border-slate-600">
          <div className="flex items-start gap-4">
            <div className="bg-slate-500/50 p-3 rounded-xl">
              {activeTab === "details" ? (
                <Package className="w-6 h-6 text-white" />
              ) : (
                <TrendingUp className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight capitalize">
                {activeTab === "details" ? "Product Specifications" : "Market Performance"}
              </h2>
              <p className="text-slate-300 text-sm font-medium mt-0.5">
                {activeTab === "details" ? "Comprehensive item details and variations" : "Sales analytics and distribution data"}
              </p>
            </div>
          </div>
        </div>

        {/* Card Content Section */}
        <div className="p-6 sm:p-8 bg-gray-950">
          {activeTab === "details" ? (
            /* Details Tab Content */
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Images Section */}
                <div className="lg:col-span-4">
                  <div className="aspect-square bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center group relative shadow-inner">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={typeof item.images[0] === 'string' ? item.images[0] : (item.images[0].url || item.images[0].preview)}
                        alt={item.itemName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-gray-600">
                        <Package className="w-12 h-12" />
                        <span className="font-bold text-sm">No images available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Grid Section */}
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[
                      { label: "Item ID", value: item.itemId, color: "text-blue-400" },
                      { label: "Short Code", value: item.shortCode },
                      { label: "Group", value: item.group },
                      { label: "Category", value: item.category },
                      { label: "Item Type", value: item.itemType },
                      { label: "Unit Type", value: item.unitType },
                      { label: "HSN Code", value: item.hsnCode || "-" },
                      { label: "GST (%)", value: `${item.gst || 0}%`, color: "text-emerald-400" },
                      { label: "Profit Margin (%)", value: `${item.profitMargin || 0}%`, color: "text-emerald-400" },
                    ].map((info, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-900 p-5 rounded-2xl border border-gray-800 group hover:border-gray-700 transition-all duration-300"
                      >
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
                          {info.label}
                        </span>
                        <span className={`text-lg font-black truncate block ${info.color || "text-white"}`}>
                          {info.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variations Section */}
              <div className="space-y-8 pt-8 border-t border-gray-800">
                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                  Available Variations
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
                  <span className="bg-gray-900 text-gray-400 px-4 py-1.5 rounded-full text-xs font-black border border-gray-800">
                    {item.variations?.length || 0} TOTAL
                  </span>
                </h3>

                {item.variations && item.variations.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {item.variations.map((variation: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900 hover:border-gray-700 transition-all duration-300"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                          {[
                            { label: "Variation", value: variation.value, color: "text-blue-400" },
                            { label: "Base Price", value: `₹${variation.price}`, color: "text-emerald-400" },
                            { label: "SAP Code", value: variation.sapCode || "-", color: "text-gray-300" },
                            { label: "Profit Margin", value: `${variation.profitMargin || 0}%`, color: "text-emerald-400" },
                            { label: "Sale Type", value: variation.saleType || "QTY", color: "text-gray-400" },
                          ].map((vInfo, vIdx) => (
                            <div key={vIdx} className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {vInfo.label}
                              </span>
                              <span className={`text-base font-black ${vInfo.color}`}>
                                {vInfo.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Channels Section */}
                        <div className="pt-6 border-t border-gray-800/50">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                            Channel Price Breakdown
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {["Dining", "Parcale", "Swiggy", "Zomato", "GS1"].map((channel) => {
                              const isAuto = ["Zomato", "Swiggy", "GS1"].includes(channel);
                              let price = variation.channels?.[channel];

                              if (!price || price === 0) {
                                if (isAuto && variation.price) {
                                  const autos = calculateAutoPrices(variation.price);
                                  price = autos[channel as keyof typeof autos];
                                } else {
                                  price = variation.price || "-";
                                }
                              }

                              return (
                                <div
                                  key={channel}
                                  className={`rounded-xl p-4 transition-all border ${
                                    isAuto
                                      ? "bg-emerald-900/10 border-emerald-900/30 hover:bg-emerald-900/20"
                                      : "bg-gray-800/30 border-gray-800 hover:bg-gray-800/50"
                                  }`}
                                >
                                  <div className="flex flex-col gap-1">
                                    <span className={`text-[10px] font-black ${isAuto ? "text-emerald-500" : "text-gray-500"}`}>
                                      {channel.toUpperCase()}
                                      {isAuto && <span className="ml-1 opacity-60">(AUTO)</span>}
                                    </span>
                                    <span className={`text-lg font-black ${isAuto ? "text-emerald-400" : "text-white"}`}>
                                      ₹{price}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900/30 rounded-2xl p-12 text-center border border-dashed border-gray-800">
                    <p className="text-gray-500 font-bold">No product variations defined</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Sales Tab Content */
            <div className="space-y-8">
              {/* Filter Area */}
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 shadow-inner">
                <div className="space-y-4">
                  {/* Restaurant Selection */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                      Source Restaurant
                    </label>
                    <select
                      value={selectedRestaurant}
                      onChange={(e) => setSelectedRestaurant(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-800 bg-gray-950 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none cursor-pointer hover:bg-gray-900"
                    >
                      <option value="">All Registered Locations</option>
                      {restaurants.map((res) => (
                        <option key={res} value={res}>{res}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-4 py-3 rounded-xl border border-gray-800 bg-gray-950 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all hover:bg-gray-900"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-4 py-3 rounded-xl border border-gray-800 bg-gray-950 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all hover:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>




              {salesLoading ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-gray-500 font-black text-sm uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
                </div>
              ) : salesData ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SalesSummaryCards
                    zomatoData={salesData.zomatoData}
                    swiggyData={salesData.swiggyData}
                    diningData={salesData.diningData}
                    parcelData={salesData.parcelData}
                    saleType={item?.variations?.[0]?.saleType || "QTY"}
                  />

                  <div className="h-px bg-gray-800"></div>

                  <SalesCharts
                    monthlyData={salesData.monthlyData}
                    dateWiseData={salesData.dateWiseData}
                    restaurantSales={salesData.restaurantSales}
                  />

                </div>
              ) : (
                <div className="bg-gray-900/30 rounded-2xl p-12 text-center border border-dashed border-gray-800">
                  <p className="text-gray-500 font-bold">
                    No transaction data found for selected interval
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-8 pb-4 text-center">
        <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.2em]">
          Data Portal Analytics Engine • Premium System
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Plus, Download, Search } from "lucide-react";
import ItemForm from "@/components/Items/ItemForm";
import ItemsTable from "@/components/Items/ItemsTable";

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(lowerSearch) ||
        item.itemId?.toLowerCase().includes(lowerSearch) ||
        item.group?.toLowerCase().includes(lowerSearch) ||
        item.category?.toLowerCase().includes(lowerSearch)
    );
  }, [items, searchTerm]);

  // Fetch items from MongoDB on component mount
  useEffect(() => {
    const fetchItems = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching items (attempt ${retryCount + 1})...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/items", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status} ${response.statusText}`,
          );
        }
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} items from MongoDB`);
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Failed to fetch items:", error);

        // Retry once after 2 seconds if it's a network error
        if (
          retryCount < 1 &&
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          console.log("⏳ Retrying in 2 seconds...");
          setTimeout(() => fetchItems(retryCount + 1), 2000);
          return;
        }

        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleAddItem = (newItem: any) => {
    // Item is already saved in MongoDB via API
    // Just add it to the local state for immediate UI update
    setItems([...items, newItem]);
    setShowForm(false);
  };

  // Migrate existing items to add GS1 channel (runs once on mount)
  useEffect(() => {
    const migrateGS1 = async () => {
      try {
        const response = await fetch("/api/items/migrate/add-gs1", {
          method: "POST",
        });
        if (response.ok) {
          const result = await response.json();
          console.log("✅ GS1 migration completed:", result);
        }
      } catch (error) {
        console.error("GS1 migration failed (non-critical):", error);
      }
    };

    migrateGS1();
  }, []);

  const handleDownload = () => {
    // Export items as CSV/Excel
    const csv = convertToCSV(items);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "items.csv";
    a.click();
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    // Define the columns to export
    const headers = [
      "Item ID",
      "Item Name",
      "Short Code",
      "Description",
      "HSN Code",
      "Group",
      "Category",
      "Profit Margin (%)",
      "GST (%)",
      "Item Type",
      "Unit Type",
      "Variations",
      "Images Count",
    ];

    const rows = data.map((item) => [
      item.itemId,
      item.itemName,
      item.shortCode,
      item.description || "",
      item.hsnCode || "",
      item.group,
      item.category,
      item.profitMargin || 0,
      item.gst || 0,
      item.itemType,
      item.unitType,
      item.variations?.map((v: any) => `${v.name}: ${v.value}`).join("; ") ||
        "",
      item.images?.length || 0,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell || "");
            return value.includes(",") ||
              value.includes('"') ||
              value.includes("\n")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    return csv;
  };

  return (
    <div className="flex-1 p-4 xs:p-5 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6">
          {/* Title Section */}
          <div className="w-full sm:w-auto group cursor-default">
            <div className="flex items-start sm:items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3.5 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-600/40 flex-shrink-0">
                <span className="text-white text-2xl font-bold">📦</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  Items
                </h1>
                <p className="text-gray-400 text-sm sm:text-base font-medium mt-2">
                  Manage your product items and variations
                </p>
                {loading && (
                  <p className="text-gray-500 text-xs sm:text-sm mt-3 inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Loading items from MongoDB...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
            {items.length > 0 && !loading && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 xs:px-5 sm:px-6 py-3 bg-gradient-to-r from-emerald-600/20 to-emerald-600/10 border border-emerald-600/50 text-emerald-300 hover:text-emerald-200 rounded-xl hover:from-emerald-600/30 hover:to-emerald-600/20 hover:border-emerald-500/60 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-500/30 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                <Download className="w-4 h-4 xs:w-4.5 xs:h-4.5 relative z-10" />
                <span className="hidden xs:inline relative z-10">Download</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 xs:px-5 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-blue-600/40 hover:shadow-xl hover:shadow-blue-500/60 hover:scale-[1.02] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/15 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
              <Plus className="w-4 h-4 xs:w-4.5 xs:h-4.5 relative z-10" />
              <span className="hidden xs:inline relative z-10">Add Item</span>
              <span className="xs:hidden relative z-10">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search bar - Desktop */}
      {!loading && (
        <div className="mb-6 relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search items by name, ID, group, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800/50 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-600/10 hover:border-slate-600/80 hover:bg-slate-800/70 placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/60 border border-gray-800 backdrop-blur-xl">
            <ItemForm
              onSuccess={handleAddItem}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Search bar - Mobile only */}
      {!loading && (
        <div className="mb-5 sm:hidden relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800/50 text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-600/10 hover:border-slate-600/80 hover:bg-slate-800/70 placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* Animated Spinner */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
              {/* Middle ring */}
              <div className="absolute inset-3 sm:inset-4 rounded-full border-3 border-transparent border-b-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Inner dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Loading Items
              </h3>
              <p className="text-gray-400 text-sm sm:text-base font-medium">
                Fetching your data from MongoDB...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ItemsTable items={filteredItems} />
      )}
    </div>
  );
}

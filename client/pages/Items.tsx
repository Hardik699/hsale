import { useState, useEffect, useMemo } from "react";
import { Plus, Download, Search, FileUp, Trash2 } from "lucide-react";
import ItemForm from "@/components/Items/ItemForm";
import ItemsTable from "@/components/Items/ItemsTable";
import ExcelImportDialog from "@/components/Items/ExcelImportDialog";

export default function Items() {
  const [showForm, setShowForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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
      // Create a new AbortController for each fetch attempt
      const controller = new AbortController();

      try {
        setLoading(true);
        console.log(`🔄 Fetching items (attempt ${retryCount + 1})...`);
        console.log(`📍 Fetching from: ${window.location.origin}/api/items`);

        const timeoutId = setTimeout(() => {
          console.log("⏱️ Fetch timeout after 30 seconds");
          controller.abort();
        }, 30000); // 30 second timeout

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
      } catch (error: any) {
        console.error("❌ Failed to fetch items:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack?.split("\n").slice(0, 3).join("\n"),
        });

        // Retry once after 3 seconds if it's a network error or timeout
        if (retryCount < 1) {
          if (error instanceof TypeError || error.name === "AbortError") {
            console.log("⏳ Retrying in 3 seconds...");
            setTimeout(() => fetchItems(retryCount + 1), 3000);
            return;
          }
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

  const handleImportItems = (newItems: any[]) => {
    // Add imported items to the local state
    setItems([...items, ...newItems]);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(`Are you sure you want to delete this item?`)) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems(items.filter((item) => item.itemId !== itemId));
        console.log(`✅ Item ${itemId} deleted successfully`);
      } else {
        console.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    const count = selectedItems.size;
    if (!confirm(`Delete ${count} item${count !== 1 ? "s" : ""}? This action cannot be undone.`)) return;

    setDeleting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const itemId of selectedItems) {
        try {
          const response = await fetch(`/api/items/${itemId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
          console.error(`Error deleting item ${itemId}:`, error);
        }
      }

      // Remove deleted items from local state
      const newItems = items.filter((item) => !selectedItems.has(item.itemId));
      setItems(newItems);
      setSelectedItems(new Set());

      if (successCount > 0) {
        console.log(`✅ Deleted ${successCount} item${successCount !== 1 ? "s" : ""}`);
      }
      if (failCount > 0) {
        console.error(`❌ Failed to delete ${failCount} item${failCount !== 1 ? "s" : ""}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Migrate existing items to add GS1 channel (runs once on mount)
  useEffect(() => {
    const migrateGS1 = async () => {
      try {
        console.log("🔄 Starting GS1 migration...");
        console.log(`📍 POST to: ${window.location.origin}/api/items/migrate/add-gs1`);

        const response = await fetch("/api/items/migrate/add-gs1", {
          method: "POST",
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ GS1 migration completed:", result);
        } else {
          console.warn(`⚠️ Migration returned status ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        console.error("GS1 migration failed (non-critical):", error);
        console.error("Migration error details:", {
          name: error.name,
          message: error.message,
        });
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

  const downloadTemplateWithDropdowns = async () => {
    try {
      // Import XLSX dynamically
      const XLSX = (await import("xlsx")).default;

      // Get all unique variations from existing items
      const allVariationNames = Array.from(
        new Set(items.flatMap((item) => item.variations?.map((v: any) => v.name) || []))
      ).sort();

      const allVariationValues = Array.from(
        new Set(items.flatMap((item) => item.variations?.map((v: any) => v.value) || []))
      ).sort((a, b) => {
        const parseNum = (s: string) => {
          const n = parseFloat(s.match(/\d+/)?.[0] || "0");
          if (s.toLowerCase().includes("kg") || s.toLowerCase().includes("l")) return n * 1000;
          return n;
        };
        return parseNum(a) - parseNum(b);
      });

      // Create template data
      const templateData = [
        {
          "Item Name": "Example Item",
          "Group": "Group A",
          "Category": "Category 1",
          "Description": "Item description",
          "HSN Code": "1234",
          "Unit Type": "Single Count",
          "Sale Type": "QTY",
          "Profit Margin": "20",
          "GST": "5",
          "Item Type": "Goods",
          "Variation Name": allVariationNames[0] || "Size",
          "Variation Value": allVariationValues[0] || "250 Gms",
          "Base Price": "100",
          "SAP Code": "SAP001",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);

      // Add data validation (dropdowns) for Variation Name (Column K)
      if (!ws["!dataValidation"]) ws["!dataValidation"] = [];

      const variationNameValidation = {
        type: "list",
        formula1: `"${allVariationNames.join(",")}"`,
        showInputMessage: true,
        prompt: "Select a variation name from the list",
        sqref: "K2:K1000",
      };

      const variationValueValidation = {
        type: "list",
        formula1: `"${allVariationValues.join(",")}"`,
        showInputMessage: true,
        prompt: "Select a variation value from the list",
        sqref: "L2:L1000",
      };

      ws["!dataValidation"].push(variationNameValidation);
      ws["!dataValidation"].push(variationValueValidation);

      // Set column widths
      const colWidths = [20, 15, 20, 25, 12, 15, 12, 15, 8, 12, 20, 15, 12, 15];
      ws["!cols"] = colWidths.map((w) => ({ wch: w }));

      // Style header row (optional - basic styling)
      const headerStyle = {
        font: { bold: true, color: "FFFFFF" },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center" },
      };

      // Create workbook and add sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Items");

      // Create info sheet with instructions
      const infoData = [
        ["Instructions for using this Excel template:"],
        [],
        ["1. Item Name (Required)", "Enter the name of the new item"],
        ["2. Group (Required)", "Select from existing groups"],
        ["3. Category (Required)", "Select from existing categories"],
        ["4. Variation Name (Required)", "Click dropdown to select existing variation"],
        ["5. Variation Value (Required)", "Click dropdown to select existing variation value"],
        ["6. Base Price (Required)", "Enter the base price"],
        ["7. SAP Code (Required)", "Enter SAP code for the variation"],
        [],
        ["Available Variations:"],
      ];

      // Add list of variations
      allVariationNames.forEach((name) => {
        const values = items
          .filter((item) => item.variations?.some((v: any) => v.name === name))
          .flatMap((item) => item.variations.filter((v: any) => v.name === name).map((v: any) => v.value));
        const uniqueValues = Array.from(new Set(values));
        infoData.push([`${name}:`, uniqueValues.join(", ")]);
      });

      const infoWs = XLSX.utils.aoa_to_sheet(infoData);
      infoWs["!cols"] = [{ wch: 30 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, infoWs, "Instructions");

      XLSX.writeFile(wb, "item-import-template-with-dropdowns.xlsx");
      console.log("✅ Template with dropdowns downloaded successfully");
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template. Please try again.");
    }
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
            {selectedItems.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 xs:px-5 sm:px-6 py-3 bg-gradient-to-r from-red-600/20 to-red-600/10 border border-red-600/50 text-red-300 hover:text-red-200 rounded-xl hover:from-red-600/30 hover:to-red-600/20 hover:border-red-500/60 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                <Trash2 className="w-4 h-4 xs:w-4.5 xs:h-4.5 relative z-10" />
                <span className="hidden xs:inline relative z-10">Delete ({selectedItems.size})</span>
                <span className="xs:hidden relative z-10">Delete</span>
              </button>
            )}
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
            {items.length > 0 && !loading && (
              <button
                onClick={downloadTemplateWithDropdowns}
                className="flex items-center justify-center gap-2 px-4 xs:px-5 sm:px-6 py-3 bg-gradient-to-r from-cyan-600/20 to-cyan-600/10 border border-cyan-600/50 text-cyan-300 hover:text-cyan-200 rounded-xl hover:from-cyan-600/30 hover:to-cyan-600/20 hover:border-cyan-500/60 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-500/30 group relative overflow-hidden"
                title="Download template with variation dropdowns"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                <Download className="w-4 h-4 xs:w-4.5 xs:h-4.5 relative z-10" />
                <span className="hidden xs:inline relative z-10">Template</span>
                <span className="xs:hidden relative z-10">Template</span>
              </button>
            )}
            <button
              onClick={() => setShowImportDialog(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 xs:px-5 sm:px-6 py-3 bg-gradient-to-r from-purple-600/20 to-purple-600/10 border border-purple-600/50 text-purple-300 hover:text-purple-200 rounded-xl hover:from-purple-600/30 hover:to-purple-600/20 hover:border-purple-500/60 font-semibold transition-all duration-300 text-xs xs:text-sm sm:text-base whitespace-nowrap shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
              <FileUp className="w-4 h-4 xs:w-4.5 xs:h-4.5 relative z-10" />
              <span className="hidden xs:inline relative z-10">Import Excel</span>
              <span className="xs:hidden relative z-10">Import</span>
            </button>
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

      {/* Excel Import Modal */}
      {showImportDialog && (
        <ExcelImportDialog
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportItems}
        />
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
        <ItemsTable
          items={filteredItems}
          onDelete={handleDeleteItem}
          onSelectedChange={setSelectedItems}
        />
      )}
    </div>
  );
}

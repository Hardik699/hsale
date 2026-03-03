import { useState } from "react";
import { Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

interface ExcelImportDialogProps {
  onClose: () => void;
  onSuccess: (newItems: any[]) => void;
}

interface ParsedItem {
  itemName: string;
  group: string;
  category: string;
  shortCode?: string;
  description?: string;
  hsnCode?: string;
  unitType: string;
  saleType: "QTY" | "KG";
  profitMargin: number;
  gst: number;
  itemType: "Goods" | "Service";
  variations: Array<{
    name: string;
    value: string;
    price: number;
    sapCode: string;
    saleType: "QTY" | "KG";
    profitMargin: number;
  }>;
}

// Helper function to normalize variation values for matching
const normalizeVariationValue = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, "") // Remove all spaces
    .trim();
};

export default function ExcelImportDialog({
  onClose,
  onSuccess,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "confirm">("upload");
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), {
        type: "array",
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setError("Excel file is empty");
        return;
      }

      // Validate required columns (Item ID and Short Code are optional)
      const requiredColumns = [
        "Item Name",
        "Group",
        "Category",
        "Variation Name",
        "Variation Value",
        "Base Price",
        "SAP Code",
      ];
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

      if (missingColumns.length > 0) {
        setError(
          `Missing required columns: ${missingColumns.join(", ")}\n\nRequired: ${requiredColumns.join(", ")}\n\nOptional: Item ID, Short Code (will be auto-generated if not provided)`
        );
        return;
      }

      // Show preview of first 5 rows
      setPreview(data.slice(0, 5));
      setStep("preview");
    } catch (err) {
      setError(
        `Failed to read Excel file: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  const parseExcelData = (data: any[]): ParsedItem[] => {
    const itemsMap = new Map<string, ParsedItem>();

    data.forEach((row) => {
      const itemName = row["Item Name"]?.toString().trim();
      const group = row["Group"]?.toString().trim();
      const category = row["Category"]?.toString().trim();

      if (!itemName || !group || !category) return;

      const key = itemName;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          itemName,
          group,
          category,
          shortCode: row["Short Code"]?.toString().trim() || "",
          description: row["Description"]?.toString().trim() || "",
          hsnCode: row["HSN Code"]?.toString().trim() || "",
          unitType: row["Unit Type"]?.toString().trim() || "Single Count",
          saleType: (row["Sale Type"]?.toString().toUpperCase() || "QTY") as
            | "QTY"
            | "KG",
          profitMargin: parseFloat(row["Profit Margin"] || "0") || 0,
          gst: parseFloat(row["GST"] || "0") || 0,
          itemType: (row["Item Type"]?.toString().trim() || "Goods") as
            | "Goods"
            | "Service",
          variations: [],
        });
      }

      const item = itemsMap.get(key)!;
      const variationName = row["Variation Name"]?.toString().trim();
      const variationValue = row["Variation Value"]?.toString().trim();
      const basePrice = parseFloat(row["Base Price"] || "0");
      const sapCode = row["SAP Code"]?.toString().trim();

      if (variationName && variationValue && basePrice > 0 && sapCode) {
        item.variations.push({
          name: variationName,
          value: variationValue,
          price: basePrice,
          sapCode,
          saleType: (row["Sale Type"]?.toString().toUpperCase() || "QTY") as
            | "QTY"
            | "KG",
          profitMargin: parseFloat(row["Profit Margin"] || "0") || 0,
        });
      }
    });

    return Array.from(itemsMap.values());
  };

  const calculateAutoPrices = (basePrice: number) => {
    return {
      Zomato: Math.round((basePrice * 1.15) / 5) * 5,
      Swiggy: Math.round((basePrice * 1.15) / 5) * 5,
      GS1: Math.round((basePrice * 1.2) / 5) * 5,
    };
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch existing items from database to check for duplicate variations
      const existingItemsResponse = await fetch("/api/items");
      const existingItems: any[] = await existingItemsResponse.json();

      // Build a map of normalized variation values from existing items
      const existingVariationsMap = new Map<string, Set<string>>();
      existingItems.forEach((item) => {
        if (item.variations && Array.isArray(item.variations)) {
          const itemName = item.itemName;
          if (!existingVariationsMap.has(itemName)) {
            existingVariationsMap.set(itemName, new Set());
          }
          const variationSet = existingVariationsMap.get(itemName)!;
          item.variations.forEach((v: any) => {
            // Normalize and store the variation value
            const normalized = normalizeVariationValue(v.value);
            variationSet.add(normalized);
          });
        }
      });

      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const parsedItems = parseExcelData(data);

      if (parsedItems.length === 0) {
        setError("No valid items found in Excel file");
        setLoading(false);
        return;
      }

      const createdItems: any[] = [];
      let successCount = 0;
      let failCount = 0;
      let skipped = 0;

      // Create items one by one
      for (let index = 0; index < parsedItems.length; index++) {
        try {
          const item = parsedItems[index];

          // Check if item already exists
          const itemExists = existingItems.some((ei) => ei.itemName === item.itemName);
          const existingVariations = existingVariationsMap.get(item.itemName) || new Set();

          // Filter out variations that already exist in the database
          const newVariations = item.variations.filter((v) => {
            const normalizedValue = normalizeVariationValue(v.value);
            const alreadyExists = existingVariations.has(normalizedValue);

            if (alreadyExists) {
              console.log(
                `⏭️ Skipping variation "${v.value}" for "${item.itemName}" - already exists in database`
              );
              skipped++;
            }

            return !alreadyExists;
          });

          // If all variations already exist, skip this item
          if (newVariations.length === 0 && item.variations.length > 0) {
            console.log(
              `⏭️ Skipping "${item.itemName}" - all variations already exist in database`
            );
            continue;
          }

          // If item exists but has new variations, we need to fetch and update it
          if (itemExists && newVariations.length > 0) {
            console.log(
              `📝 Adding new variations to existing item "${item.itemName}"`
            );

            // Get the existing item to get its itemId
            const existingItem = existingItems.find((ei) => ei.itemName === item.itemName);
            if (!existingItem) continue;

            // Create variations for the new ones only
            const variationsToAdd = newVariations.map((v, vIdx) => {
              const autoPrices = calculateAutoPrices(v.price);
              return {
                id: `var-${Date.now()}-${index}-${vIdx}`,
                name: v.name,
                value: v.value,
                price: v.price,
                sapCode: v.sapCode,
                gs1Code: "",
                saleType: v.saleType,
                profitMargin: v.profitMargin,
                gs1Enabled: false,
                channels: {
                  Dining: v.price,
                  Parcale: v.price,
                  Zomato: autoPrices.Zomato,
                  Swiggy: autoPrices.Swiggy,
                  GS1: autoPrices.GS1,
                },
              };
            });

            // Update the existing item with new variations
            const updateResponse = await fetch(`/api/items/${existingItem.itemId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                variations: [...(existingItem.variations || []), ...variationsToAdd],
              }),
            });

            if (updateResponse.ok) {
              createdItems.push({ ...existingItem, variations: [...(existingItem.variations || []), ...variationsToAdd] });
              successCount++;
            } else {
              failCount++;
              console.error(
                `Failed to add variations to ${item.itemName}: ${updateResponse.statusText}`
              );
            }
            continue;
          }

          // Auto-generate Item ID if not provided
          let itemId = item.shortCode || "";
          if (!itemId) {
            const groupPrefix = item.group.substring(0, 3).toUpperCase();
            const namePrefix = item.itemName.substring(0, 3).toUpperCase();
            const timestamp = Date.now();
            const counter = String(index).padStart(3, "0");
            itemId = `${groupPrefix}-${namePrefix}-${timestamp}-${counter}`;
          }

          // Auto-generate Short Code if not provided
          let shortCode = item.shortCode || "";
          if (!shortCode) {
            // Generate from first letters of item name
            const words = item.itemName.split(/\s+/);
            shortCode = words.map(w => w[0]).join("").toUpperCase();
            if (shortCode.length < 2) {
              shortCode = item.itemName.substring(0, 3).toUpperCase();
            }
          }

          // Convert variations to item variations with channels
          const variations = newVariations.map((v, vIdx) => {
            const autoPrices = calculateAutoPrices(v.price);
            return {
              id: `var-${Date.now()}-${index}-${vIdx}`,
              name: v.name,
              value: v.value,
              price: v.price,
              sapCode: v.sapCode,
              gs1Code: "",
              saleType: v.saleType,
              profitMargin: v.profitMargin,
              gs1Enabled: false,
              channels: {
                Dining: v.price,
                Parcale: v.price,
                Zomato: autoPrices.Zomato,
                Swiggy: autoPrices.Swiggy,
                GS1: autoPrices.GS1,
              },
            };
          });

          const itemToCreate = {
            itemId,
            itemName: item.itemName,
            shortCode: shortCode,
            description: item.description || "",
            hsnCode: item.hsnCode || "",
            group: item.group,
            category: item.category,
            profitMargin: item.profitMargin,
            gst: item.gst,
            itemType: item.itemType,
            unitType: item.unitType,
            variations,
            images: [],
          };

          const response = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToCreate),
          });

          if (response.ok) {
            const createdItem = await response.json();
            createdItems.push(createdItem);
            successCount++;
          } else {
            failCount++;
            console.error(
              `Failed to create ${item.itemName}: ${response.statusText}`
            );
          }
        } catch (err) {
          failCount++;
          console.error(`Error creating ${item.itemName}:`, err);
        }
      }

      setImportedCount(successCount);
      setSkippedCount(skipped);
      setStep("confirm");

      if (successCount > 0) {
        setTimeout(() => {
          onSuccess(createdItems);
          onClose();
        }, 1500);
      } else if (failCount > 0) {
        setError(`Failed to create ${failCount} items. Please check your data.`);
        setStep("preview");
      }
    } catch (err) {
      setError(
        `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Item Name": "Anjeer Roll",
        "Group": "Sweets",
        "Category": "Dry Fruits",
        "Description": "Premium dry fruit roll",
        "HSN Code": "1234",
        "Unit Type": "Single Count",
        "Sale Type": "QTY",
        "Profit Margin": "20",
        "GST": "5",
        "Item Type": "Goods",
        "Variation Name": "Size",
        "Variation Value": "250 Gms",
        "Base Price": "100",
        "SAP Code": "SAP001",
      },
      {
        "Item Name": "Anjeer Roll",
        "Group": "Sweets",
        "Category": "Dry Fruits",
        "Description": "Premium dry fruit roll",
        "HSN Code": "1234",
        "Unit Type": "Single Count",
        "Sale Type": "QTY",
        "Profit Margin": "20",
        "GST": "5",
        "Item Type": "Goods",
        "Variation Name": "Size",
        "Variation Value": "500 Gms",
        "Base Price": "180",
        "SAP Code": "SAP002",
      },
      {
        "Item Name": "Kaju Barfi",
        "Group": "Sweets",
        "Category": "Traditional",
        "Description": "Hand-made kaju barfi",
        "HSN Code": "5678",
        "Unit Type": "Single Count",
        "Sale Type": "QTY",
        "Profit Margin": "25",
        "GST": "5",
        "Item Type": "Goods",
        "Variation Name": "Weight",
        "Variation Value": "500 Gms",
        "Base Price": "250",
        "SAP Code": "SAP003",
      },
      {
        "Item Name": "Kaju Barfi",
        "Group": "Sweets",
        "Category": "Traditional",
        "Description": "Hand-made kaju barfi",
        "HSN Code": "5678",
        "Unit Type": "Single Count",
        "Sale Type": "QTY",
        "Profit Margin": "25",
        "GST": "5",
        "Item Type": "Goods",
        "Variation Name": "Weight",
        "Variation Value": "1 KG",
        "Base Price": "450",
        "SAP Code": "SAP004",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    ws.A1.f = "Item Name (Required)";
    ws.B1.f = "Group (Required)";
    ws.C1.f = "Category (Required)";

    // Set column widths
    const colWidths = [20, 15, 20, 25, 12, 15, 12, 15, 8, 12, 20, 15, 12, 15];
    ws["!cols"] = colWidths.map(w => ({ wch: w }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "item-import-template.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/60 border border-gray-800 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Import Items from Excel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-700 rounded-xl text-center hover:border-gray-600 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300 font-medium mb-2">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Supported format: .xlsx, .xls
                </p>
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs">
                    💡 <strong>Pro Tip:</strong> Item ID and Short Code are auto-generated. Just provide Item Name, Group, Category, and variation details.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <button
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Select File
                  </button>
                </label>

                {file && (
                  <p className="text-green-400 text-sm mt-3">
                    ✓ {file.name} selected
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg font-medium transition-colors"
                >
                  Download Template
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Import Error</p>
                    <p className="text-red-200 text-sm whitespace-pre-wrap mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-300 font-medium mb-3">Preview (First 5 rows) - Item ID & Short Code will be auto-generated</p>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0">
                      <tr className="bg-gray-800/50 border-b border-gray-700">
                        {[
                          "Item Name",
                          "Group",
                          "Category",
                          "Variation",
                          "Price",
                          "SAP Code",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left text-gray-400 font-medium text-xs"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="px-3 py-2 text-gray-300 text-xs">
                            {row["Item Name"]}
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs">
                            {row["Group"]}
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs">
                            {row["Category"]}
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs">
                            {row["Variation Name"]} - {row["Variation Value"]}
                          </td>
                          <td className="px-3 py-2 text-gray-300 text-xs">
                            ₹{row["Base Price"]}
                          </td>
                          <td className="px-3 py-2 text-gray-400 text-xs">
                            {row["SAP Code"]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                    setError(null);
                    setStep("upload");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || !file}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? "Importing..." : "Import Items"}
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-2">
                  Import Complete!
                </p>
                <p className="text-gray-300">
                  {importedCount} item{importedCount !== 1 ? "s" : ""} created successfully
                </p>
                {skippedCount > 0 && (
                  <p className="text-gray-400 text-sm mt-2">
                    ⏭️ {skippedCount} variation{skippedCount !== 1 ? "s" : ""} skipped (already exist in database)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

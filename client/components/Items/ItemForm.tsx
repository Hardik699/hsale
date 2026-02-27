import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { generateItemId, generateShortCode } from "@/lib/itemHelpers";

const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato", "GS1"];
const ITEM_TYPES = ["Service", "Goods"];
const UNIT_TYPES = ["Single Count", "GM to KG", "All Count"];
const GST_OPTIONS = ["0%", "5%", "12%", "18%", "28%"];
const HSN_CODES = [
  "1001",
  "1002",
  "1003",
  "1004",
  "1005",
  "2101",
  "2102",
  "2201",
  "2202",
  "2301",
];
const VARIATION_VALUES = [
  "200 Gms",
  "250 Gms",
  "500 Gms",
  "1 Kg",
  "500 ml",
  "1 L",
  "2 L",
];

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

interface Variation {
  id: string;
  name: string;
  value: string;
  area?: string;
  channels: Record<string, number>;
  price: number;
  sapCode: string;
  gs1Code?: string;
  saleType?: "QTY" | "KG";
  profitMargin: number;
  gs1Enabled?: boolean;
  salesHistory?: Array<{
    date: string;
    channel: "Dining" | "Parcel" | "Online";
    quantity: number;
    value: number;
    category?: string;
  }>;
}

interface ItemFormProps {
  onSuccess: (item: any) => void;
  onClose: () => void;
}

export default function ItemForm({ onSuccess, onClose }: ItemFormProps) {
  const [itemId] = useState(generateItemId());
  const [itemName, setItemName] = useState("");
  const [shortCode] = useState(generateShortCode());
  const [description, setDescription] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [gst, setGst] = useState("");
  const [itemType, setItemType] = useState("Goods");
  const [unitType, setUnitType] = useState("Single Count");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [hsnCodes, setHsnCodes] = useState<string[]>(HSN_CODES);
  const [variationValues, setVariationValues] =
    useState<string[]>(VARIATION_VALUES);
  const [newGroup, setNewGroup] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newHsnCode, setNewHsnCode] = useState("");
  const [newVariationValue, setNewVariationValue] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to capitalize first letter of each word
  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Load groups, categories, HSN codes, and variation values from MongoDB API
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const response = await fetch("/api/items/dropdowns");
        if (response.ok) {
          const data = await response.json();
          if (data.groups) setGroups(data.groups);
          if (data.categories) setCategories(data.categories);
          if (data.hsnCodes) setHsnCodes(data.hsnCodes);
          if (data.variationValues) setVariationValues(data.variationValues);
        }
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
      }
    };

    loadDropdownData();
  }, []);

  const addGroup = async () => {
    if (newGroup.trim() && !groups.includes(newGroup)) {
      try {
        const response = await fetch("/api/items/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newGroup }),
        });
        if (response.ok) {
          const updated = [...groups, newGroup];
          setGroups(updated);
          setGroup(newGroup);
          setNewGroup("");
        }
      } catch (error) {
        console.error("Failed to add group:", error);
      }
    }
  };

  const addCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory)) {
      try {
        const response = await fetch("/api/items/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategory }),
        });
        if (response.ok) {
          const updated = [...categories, newCategory];
          setCategories(updated);
          setCategory(newCategory);
          setNewCategory("");
        }
      } catch (error) {
        console.error("Failed to add category:", error);
      }
    }
  };

  const addHsnCode = async () => {
    if (newHsnCode.trim() && !hsnCodes.includes(newHsnCode)) {
      try {
        const response = await fetch("/api/items/hsn-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: newHsnCode }),
        });
        if (response.ok) {
          const updated = [...hsnCodes, newHsnCode];
          setHsnCodes(updated);
          setHsnCode(newHsnCode);
          setNewHsnCode("");
        }
      } catch (error) {
        console.error("Failed to add HSN code:", error);
      }
    }
  };

  const addVariationValue = async () => {
    if (
      newVariationValue.trim() &&
      !variationValues.includes(newVariationValue)
    ) {
      try {
        const response = await fetch("/api/items/variation-values", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: newVariationValue }),
        });
        if (response.ok) {
          const updated = [...variationValues, newVariationValue];
          setVariationValues(updated);
          setNewVariationValue("");
        }
      } catch (error) {
        console.error("Failed to add variation value:", error);
      }
    }
  };

  const addVariation = () => {
    const newVariation: Variation = {
      id: Date.now().toString(),
      name: "",
      value: "",
      area: "",
      channels: CHANNELS.reduce((acc, ch) => ({ ...acc, [ch]: 0 }), {}),
      price: 0,
      sapCode: "",
      gs1Code: "",
      saleType: "QTY",
      profitMargin: 0,
      gs1Enabled: false,
      salesHistory: [],
    };
    setVariations([...variations, newVariation]);
  };

  const updateVariation = (id: string, field: string, value: any) => {
    setVariations(
      variations.map((v) => {
        if (v.id !== id) return v;

        const updated = { ...v, [field]: value };

        // Auto-calculate prices when base price changes
        if (field === "price") {
          const autoPrices = calculateAutoPrices(value);
          // Ensure all channels exist in the object before updating
          const channelsWithDefaults = CHANNELS.reduce(
            (acc, ch) => ({ ...acc, [ch]: updated.channels?.[ch] ?? 0 }),
            {} as Record<string, number>
          );
          updated.channels = {
            ...channelsWithDefaults,
            // Base price for Dining and Parcel
            Dining: value || 0,
            Parcale: value || 0,
            // Auto-calculated prices for Zomato and Swiggy (+15%)
            Zomato: autoPrices.Zomato,
            Swiggy: autoPrices.Swiggy,
          };
          // Add GS1 price if GS1 is enabled (+20%)
          if (updated.gs1Enabled) {
            updated.channels.GS1 = autoPrices.GS1;
          }
        }

        // When GS1 is toggled, calculate or clear GS1 price
        if (field === "gs1Enabled") {
          if (value) {
            // Enable GS1: calculate auto price
            const autoPrices = calculateAutoPrices(updated.price);
            updated.channels.GS1 = autoPrices.GS1;
          } else {
            // Disable GS1: set to 0
            updated.channels.GS1 = 0;
          }
        }

        return updated;
      }),
    );
  };

  const updateChannelPrice = (id: string, channel: string, value: number) => {
    setVariations(
      variations.map((v) =>
        v.id === id
          ? { ...v, channels: { ...v.channels, [channel]: value } }
          : v,
      ),
    );
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter((v) => v.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return; // Prevent double submission
    }

    if (!itemName || !group || !category) {
      alert("Please fill all required fields");
      return;
    }

    const item = {
      itemId,
      itemName,
      shortCode,
      description,
      hsnCode,
      group,
      category,
      profitMargin: parseFloat(profitMargin) || 0,
      gst: parseFloat(gst) || 0,
      itemType,
      unitType,
      variations,
      images: imagePreviews,
    };

    try {
      setIsSubmitting(true);
      console.log("📤 Saving item to MongoDB:", item.itemId);
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const savedItem = await response.json();
      console.log("✅ Item saved successfully:", savedItem.itemId);
      onSuccess(savedItem);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to save item:", errorMessage);
      alert(`Error saving item: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-gray-900 transition-colors duration-300 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Add New Item</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-300 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Item ID (Auto)
            </label>
            <input
              type="text"
              value={itemId}
              disabled
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-400 transition-colors duration-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Item Name *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(toTitleCase(e.target.value))}
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Short Code (Auto)
            </label>
            <input
              type="text"
              value={shortCode}
              disabled
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              HSN Code
            </label>
            <div className="flex gap-2">
              <select
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="" className="bg-gray-800 text-white">Select HSN Code</option>
                {hsnCodes.map((code) => (
                  <option key={code} value={code} className="bg-gray-800 text-white">
                    {code}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewHsnCode("")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 text-sm"
              >
                +
              </button>
            </div>
            {newHsnCode !== null && newHsnCode !== undefined && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newHsnCode}
                  onChange={(e) => setNewHsnCode(e.target.value)}
                  placeholder="Enter new HSN Code"
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={addHsnCode}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-semibold transition-colors duration-300"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              GST (%)
            </label>
            <select
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="" className="bg-gray-800 text-white">Select GST</option>
              {GST_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-gray-800 text-white">
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Group & Category with Add Option */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Group *
            </label>
            <div className="flex gap-2">
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              >
                <option value="" className="bg-gray-800 text-white">Select Group</option>
                {groups.map((g) => (
                  <option key={g} value={g} className="bg-gray-800 text-white">
                    {g}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewGroup("")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 text-sm"
              >
                +
              </button>
            </div>
            {newGroup !== null && newGroup !== undefined && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(toTitleCase(e.target.value))}
                  placeholder="Enter new group"
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={addGroup}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-semibold transition-colors duration-300"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Category *
            </label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              >
                <option value="" className="bg-gray-800 text-white">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-gray-800 text-white">
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewCategory("")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 text-sm"
              >
                +
              </button>
            </div>
            {newCategory !== null && newCategory !== undefined && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(toTitleCase(e.target.value))}
                  placeholder="Enter new category"
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-semibold transition-colors duration-300"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item Type & Unit Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Profit Margin (%)
            </label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(e.target.value)}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Item Type
            </label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type} className="bg-gray-800 text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Unit Type
            </label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {UNIT_TYPES.map((type) => (
                <option key={type} value={type} className="bg-gray-800 text-white">
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(toTitleCase(e.target.value))}
            className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm min-h-[100px]"
            placeholder="Enter item description"
          />
        </div>

        {/* Variations Section */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Variations</h3>
            <button
              type="button"
              onClick={addVariation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Variation
            </button>
          </div>

          {variations.map((variation) => (
            <div
              key={variation.id}
              className="mb-6 p-4 border border-gray-700 rounded-lg bg-gray-800/30"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Variation Value
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={variation.value}
                      onChange={(e) =>
                        updateVariation(variation.id, "value", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="" className="bg-gray-800 text-white">Select Variation</option>
                      {variationValues.map((val) => (
                        <option key={val} value={val} className="bg-gray-800 text-white">
                          {val}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setNewVariationValue("")}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 text-sm"
                    >
                      +
                    </button>
                  </div>
                  {newVariationValue !== null &&
                    newVariationValue !== undefined && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={newVariationValue}
                          onChange={(e) => setNewVariationValue(toTitleCase(e.target.value))}
                          placeholder="e.g., 300 Gms, 1.5 L"
                          autoFocus
                          className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={addVariationValue}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-semibold transition-colors duration-300"
                        >
                          Add
                        </button>
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Price
                  </label>
                  <input
                    type="number"
                    value={variation.price}
                    onChange={(e) =>
                      updateVariation(
                        variation.id,
                        "price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    SAP Code
                  </label>
                  <input
                    type="text"
                    value={variation.sapCode}
                    onChange={(e) =>
                      updateVariation(variation.id, "sapCode", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    value={variation.profitMargin}
                    onChange={(e) =>
                      updateVariation(
                        variation.id,
                        "profitMargin",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                    Sale Type
                  </label>
                  <select
                    value={variation.saleType || "QTY"}
                    onChange={(e) =>
                      updateVariation(
                        variation.id,
                        "saleType",
                        e.target.value as "QTY" | "KG"
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="QTY" className="bg-gray-800 text-white">QTY (Quantity)</option>
                    <option value="KG" className="bg-gray-800 text-white">KG (Kilogram)</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    {variation.saleType === "KG"
                      ? "KG: Converts value (e.g. 250 Gms) to weight (0.25)"
                      : "QTY: Counts each unit as 1.0"}
                  </p>
                </div>
              </div>

              {/* Channel Prices */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Channel Prices
                  </label>
                  <div className="text-xs text-blue-300 bg-blue-900/30 px-3 py-2 rounded border border-blue-800 space-y-1">
                    <p>Zomato & Swiggy: auto +15% (rounded to 5)</p>
                    <p>GS1: auto +20% (rounded to 5) - Optional</p>
                  </div>
                </div>

                {/* Standard Channels (excluding GS1) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {CHANNELS.filter((ch) => ch !== "GS1").map((channel) => {
                    const isAutoCalculated = ["Zomato", "Swiggy"].includes(
                      channel,
                    );
                    return (
                      <div key={channel}>
                        <label className="text-xs text-gray-400 block mb-1 font-semibold">
                          {channel}
                          {isAutoCalculated && (
                            <span className="text-blue-400 font-semibold">
                              {" "}
                              (auto)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={variation.channels[channel] || 0}
                          onChange={(e) =>
                            updateChannelPrice(
                              variation.id,
                              channel,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          step="0.01"
                          disabled={isAutoCalculated}
                          className={`w-full px-3 py-2 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isAutoCalculated
                              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                              : "bg-gray-800 text-white"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* GS1 with Checkbox and Code */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`gs1-checkbox-${variation.id}`}
                      checked={variation.gs1Enabled || false}
                      onChange={(e) =>
                        updateVariation(
                          variation.id,
                          "gs1Enabled",
                          e.target.checked,
                        )
                      }
                      className="w-4 h-4 border-gray-700 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <label
                      htmlFor={`gs1-checkbox-${variation.id}`}
                      className="text-sm font-semibold text-gray-300 cursor-pointer flex-1"
                    >
                      Enable GS1 Channel
                    </label>
                  </div>

                  {variation.gs1Enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* GS1 Price */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                          GS1 Price (auto)
                        </label>
                        <input
                          type="number"
                          value={variation.channels.GS1 || 0}
                          placeholder="Auto: 0"
                          step="0.01"
                          disabled
                          className="w-full px-3 py-2 border border-gray-700 rounded-lg text-sm bg-gray-700 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-blue-400 mt-1">
                          Auto +20% (rounded to 5)
                        </p>
                      </div>

                      {/* GS1 Code */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                          GS1 Code
                        </label>
                        <input
                          type="text"
                          value={variation.gs1Code || ""}
                          onChange={(e) =>
                            updateVariation(
                              variation.id,
                              "gs1Code",
                              e.target.value,
                            )
                          }
                          placeholder="Enter GS1 code"
                          className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeVariation(variation.id)}
                className="flex items-center gap-2 text-red-400 hover:bg-red-900/30 hover:text-red-300 px-3 py-2 rounded-lg transition-colors duration-300 font-semibold text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Image Upload */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-lg font-bold text-white mb-4">Images</h3>
          <div className="mb-4 border-2 border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-800/20 hover:bg-gray-800/40 transition-colors duration-300">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-input"
            />
            <label htmlFor="image-input" className="cursor-pointer block">
              <p className="text-gray-300 font-medium">
                Click to upload or drag images
              </p>
              <p className="text-gray-500 text-sm">PNG, JPG up to 10MB</p>
            </label>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${idx}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 border-t border-gray-800 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Item"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

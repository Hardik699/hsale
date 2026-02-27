import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHANNELS = ["Dining", "Parcale", "Swiggy", "Zomato"];

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

interface ItemsTableProps {
  items: any[];
}

export default function ItemsTable({ items }: ItemsTableProps) {
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const paginatedItems = items.slice(startIdx, startIdx + itemsPerPage);

  const uniqueVariationValues = Array.from(
    new Set(
      items.flatMap((item) =>
        (item.variations || []).map((v: any) => v.value)
      )
    )
  ).sort((a, b) => {
    // Basic numeric sort for strings like "250 Gms", "1 Kg"
    const parseNum = (s: string) => {
      const n = parseFloat(s.match(/\d+/)?.[0] || "0");
      if (s.toLowerCase().includes("kg") || s.toLowerCase().includes("l")) return n * 1000;
      return n;
    };
    return parseNum(a) - parseNum(b);
  });

  const getPrice = (item: any, variationValue: string, channel: string) => {
    const variation = (item.variations || []).find((v: any) => v.value === variationValue);
    if (!variation) return "-";

    // Standardized channel name handling (map from user image labels if necessary)
    const channelMap: Record<string, string> = {
      "Dining": "Dining",
      "parcal": "Parcale",
      "Swiggy": "Swiggy",
      "zomato": "Zomato"
    };
    const internalChannel = channelMap[channel] || channel;

    let price = variation.channels?.[internalChannel];

    // Auto calculate if not set
    if (!price || price === 0) {
      if (["Zomato", "Swiggy"].includes(internalChannel)) {
        const autoPrices = calculateAutoPrices(variation.price || 0);
        price = autoPrices[internalChannel as keyof typeof autoPrices];
      } else {
        price = variation.price;
      }
    }

    return price && price > 0 ? `₹${price}` : "-";
  };

  const toggleRowSelection = (itemId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedItems.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedItems.map((item) => item.itemId)));
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 sm:p-12 text-center shadow-md">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-300 text-sm font-medium">No items added yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop/Tablet View - Full Table */}
      <div className="hidden md:block bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-max w-full border-collapse">
            {/* Table Header */}
            <thead>
              {/* Row 1: Basic Info and Variation */}
              <tr className="bg-slate-900/60 text-gray-100 text-xs sm:text-sm font-bold border-b border-slate-700/40">
                <th rowSpan={3} className="px-3 sm:px-4 py-3 text-center border-r border-slate-700/40 sticky left-0 z-30 bg-slate-900/70 w-12">
                  <input
                    type="checkbox"
                    checked={paginatedItems.length > 0 && selectedRows.size === paginatedItems.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer accent-blue-500 rounded"
                  />
                </th>
                <th rowSpan={3} className="px-3 sm:px-4 py-3 text-left border-r border-slate-700/40 sticky left-12 z-30 bg-slate-900/70 min-w-[140px]">
                  Item Name
                </th>
                <th rowSpan={3} className="px-3 sm:px-4 py-3 text-center border-r border-slate-700/40 bg-slate-900/60">
                  Group
                </th>
                <th rowSpan={3} className="px-3 sm:px-4 py-3 text-center border-r border-slate-700/40 bg-slate-900/60">
                  Category
                </th>
                {uniqueVariationValues.length > 0 && (
                  <th colSpan={uniqueVariationValues.length * 4} className="px-4 py-3 text-center bg-blue-900/30 border-b border-blue-500/20 font-bold text-blue-100">
                    Pricing
                  </th>
                )}
              </tr>

              {/* Row 2: Variation Values */}
              <tr className="bg-slate-800/40 text-gray-100 text-xs font-bold border-b border-slate-700/40">
                {uniqueVariationValues.map((v) => (
                  <th key={v} colSpan={4} className="px-2 sm:px-3 py-2.5 text-center bg-slate-700/30 border border-slate-600/40 rounded mx-0.5 text-gray-200 text-[11px]">
                    {v}
                  </th>
                ))}
              </tr>

              {/* Row 3: Channels */}
              <tr className="bg-slate-800/30 text-gray-300 text-[10px] sm:text-xs font-bold border-b border-slate-700/40">
                {uniqueVariationValues.map((v) => (
                  <React.Fragment key={`${v}-channels`}>
                    <th className="px-2 py-2 text-center border border-slate-600/40 mx-0.5 bg-slate-700/30 rounded text-gray-200 font-bold">Dining</th>
                    <th className="px-2 py-2 text-center border border-slate-600/40 mx-0.5 bg-slate-700/30 rounded text-gray-200 font-bold">Parcal</th>
                    <th className="px-2 py-2 text-center border border-slate-600/40 mx-0.5 bg-slate-700/30 rounded text-gray-200 font-bold">Swiggy</th>
                    <th className="px-2 py-2 text-center border border-slate-600/40 mx-0.5 bg-slate-700/30 rounded text-gray-200 font-bold">Zomato</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedItems.map((item) => (
                <tr
                  key={item.itemId}
                  onClick={() => navigate(`/items/${item.itemId}`)}
                  className={`border-b border-slate-700/30 cursor-pointer text-xs transition-all duration-200 group ${
                    selectedRows.has(item.itemId) ? "bg-blue-600/15 shadow-md shadow-blue-500/20" : "bg-slate-800/20 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-slate-900/50 hover:border-slate-700/50"
                  }`}
                >
                  {/* Checkbox */}
                  <td className={`px-3 sm:px-4 py-3 text-center border-r border-slate-700/40 sticky left-0 z-10 transition-colors ${selectedRows.has(item.itemId) ? "bg-blue-600/15" : "bg-slate-800/20 group-hover:bg-slate-800/50"}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.itemId)}
                      onChange={() => toggleRowSelection(item.itemId)}
                      className="w-4 h-4 accent-blue-500 rounded cursor-pointer transition-transform hover:scale-110"
                    />
                  </td>

                  {/* Item Name */}
                  <td className={`px-3 sm:px-4 py-3 text-white font-semibold sticky left-12 z-10 border-r border-slate-700/40 transition-colors ${selectedRows.has(item.itemId) ? "bg-blue-600/15" : "bg-slate-800/20 group-hover:bg-slate-800/50"}`}>
                    <span className="truncate block">{item.itemName}</span>
                  </td>

                  <td className="px-3 sm:px-4 py-3 text-gray-300 text-center border-r border-slate-700/40 text-xs">
                    {item.group}
                  </td>

                  <td className="px-3 sm:px-4 py-3 text-gray-300 text-center border-r border-slate-700/40 text-xs">
                    {item.category}
                  </td>

                  {/* Prices */}
                  {uniqueVariationValues.map((v) => (
                    <React.Fragment key={`${item.itemId}-${v}-prices`}>
                      <td className="px-2 py-3 text-center font-bold text-gray-100 mx-0.5 rounded border border-slate-600/30 bg-slate-700/20 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, v, "Dining")}</td>
                      <td className="px-2 py-3 text-center font-bold text-gray-100 mx-0.5 rounded border border-slate-600/30 bg-slate-700/20 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, v, "Parcal")}</td>
                      <td className="px-2 py-3 text-center font-bold text-gray-100 mx-0.5 rounded border border-slate-600/30 bg-slate-700/20 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, v, "Swiggy")}</td>
                      <td className="px-2 py-3 text-center font-bold text-gray-100 mx-0.5 rounded border border-slate-600/30 bg-slate-700/20 text-xs" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, v, "Zomato")}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {paginatedItems.map((item) => (
          <div
            key={item.itemId}
            onClick={() => navigate(`/items/${item.itemId}`)}
            className="bg-slate-800/30 border border-slate-700/40 rounded-lg p-4 cursor-pointer hover:bg-slate-800/60 hover:border-slate-700/60 hover:shadow-lg hover:shadow-slate-900/40 transition-all duration-200 group"
          >
            <div className="space-y-3">
              {/* Item Name */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm flex-1 line-clamp-2">{item.itemName}</h3>
                <input
                  type="checkbox"
                  checked={selectedRows.has(item.itemId)}
                  onChange={() => toggleRowSelection(item.itemId)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer flex-shrink-0"
                />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Group</p>
                  <p className="text-gray-200 font-medium">{item.group}</p>
                </div>
                <div>
                  <p className="text-gray-400">Category</p>
                  <p className="text-gray-200 font-medium">{item.category}</p>
                </div>
              </div>

              {/* Pricing Preview - First variation only */}
              {uniqueVariationValues.length > 0 && (
                <div className="pt-2 border-t border-slate-700/40">
                  <p className="text-gray-400 text-xs mb-3">Pricing ({uniqueVariationValues[0]})</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center bg-slate-700/30 rounded-lg p-2 border border-slate-600/40">
                      <p className="text-gray-300 text-[10px] font-semibold mb-1">Dining</p>
                      <p className="text-gray-100 font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, uniqueVariationValues[0], "Dining")}</p>
                    </div>
                    <div className="text-center bg-slate-700/30 rounded-lg p-2 border border-slate-600/40">
                      <p className="text-gray-300 text-[10px] font-semibold mb-1">Parcal</p>
                      <p className="text-gray-100 font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, uniqueVariationValues[0], "Parcal")}</p>
                    </div>
                    <div className="text-center bg-slate-700/30 rounded-lg p-2 border border-slate-600/40">
                      <p className="text-gray-300 text-[10px] font-semibold mb-1">Swiggy</p>
                      <p className="text-gray-100 font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, uniqueVariationValues[0], "Swiggy")}</p>
                    </div>
                    <div className="text-center bg-slate-700/30 rounded-lg p-2 border border-slate-600/40">
                      <p className="text-gray-300 text-[10px] font-semibold mb-1">Zomato</p>
                      <p className="text-gray-100 font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{getPrice(item, uniqueVariationValues[0], "Zomato")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Pagination */}
      <div className="px-4 sm:px-6 py-4 border border-slate-700/40 rounded-lg bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs sm:text-sm text-gray-400">
          Showing <span className="text-gray-100">{startIdx + 1}</span> to{" "}
          <span className="text-gray-100">{Math.min(startIdx + itemsPerPage, items.length)}</span> of{" "}
          <span className="text-gray-100">{items.length}</span> items
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1.5 hover:bg-slate-700/50 rounded disabled:opacity-30 transition-colors text-gray-400 border border-slate-700/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
            const displayIdx = totalPages <= 5 ? idx : Math.max(0, Math.min(idx + Math.max(0, currentPage - 2), totalPages - 5)) + idx;
            return (
              <button
                key={displayIdx}
                onClick={() => setCurrentPage(displayIdx)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  currentPage === displayIdx
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-300 hover:bg-slate-700/40"
                }`}
              >
                {displayIdx + 1}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1.5 hover:bg-slate-700/50 rounded disabled:opacity-30 transition-colors text-gray-400 border border-slate-700/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="ml-2 pl-2 border-l border-slate-600/40 text-xs bg-slate-700/40 text-gray-100 rounded px-2 py-1"
          >
            {[5, 10, 15, 20, 30, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

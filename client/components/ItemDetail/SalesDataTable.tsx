import { BarChart3 } from "lucide-react";

interface SalesRow {
  variationName: string;
  sapCode: string;
  zomato: {
    quantity: number;
    value: number;
  };
  swiggy: {
    quantity: number;
    value: number;
  };
  dining: {
    quantity: number;
    value: number;
  };
  parcel: {
    quantity: number;
    value: number;
  };
  total: {
    quantity: number;
    value: number;
  };
}

interface SalesDataTableProps {
  data: SalesRow[];
  itemName: string;
  saleType?: "QTY" | "KG";
}

export default function SalesDataTable({ data, itemName, saleType = "QTY" }: SalesDataTableProps) {
  const calculateTotals = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        zomatoQty: 0,
        zomatoValue: 0,
        swiggyQty: 0,
        swiggyValue: 0,
        diningQty: 0,
        diningValue: 0,
        parcelQty: 0,
        parcelValue: 0,
        totalQty: 0,
        totalValue: 0,
      };
    }

    return data.reduce(
      (acc, row) => ({
        zomatoQty: acc.zomatoQty + row.zomato.quantity,
        zomatoValue: acc.zomatoValue + row.zomato.value,
        swiggyQty: acc.swiggyQty + row.swiggy.quantity,
        swiggyValue: acc.swiggyValue + row.swiggy.value,
        diningQty: acc.diningQty + row.dining.quantity,
        diningValue: acc.diningValue + row.dining.value,
        parcelQty: acc.parcelQty + row.parcel.quantity,
        parcelValue: acc.parcelValue + row.parcel.value,
        totalQty: acc.totalQty + row.total.quantity,
        totalValue: acc.totalValue + row.total.value,
      }),
      {
        zomatoQty: 0,
        zomatoValue: 0,
        swiggyQty: 0,
        swiggyValue: 0,
        diningQty: 0,
        diningValue: 0,
        parcelQty: 0,
        parcelValue: 0,
        totalQty: 0,
        totalValue: 0,
      }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-gray-900">Item-wise & Variation-wise Data</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Variation</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">SAP Code</th>

              {/* Zomato */}
              <th className="px-4 py-3 text-center font-semibold text-accent-pink">Zomato Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-accent-pink">Zomato Value</th>

              {/* Swiggy */}
              <th className="px-4 py-3 text-center font-semibold text-accent-orange">Swiggy Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-accent-orange">Swiggy Value</th>

              {/* Dining */}
              <th className="px-4 py-3 text-center font-semibold text-accent-teal">Dining Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-accent-teal">Dining Value</th>

              {/* Parcel */}
              <th className="px-4 py-3 text-center font-semibold text-primary">Parcel Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-primary">Parcel Value</th>

              {/* Total */}
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Total Qty</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data && Array.isArray(data) && data.length > 0 ? data.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{row.variationName}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{row.sapCode || "-"}</td>

                {/* Zomato */}
                <td className="px-4 py-3 text-center text-gray-900">
                  {saleType === "KG" ? row.zomato.quantity.toFixed(2) : row.zomato.quantity}
                </td>
                <td className="px-4 py-3 text-center text-gray-900">₹{row.zomato.value.toLocaleString()}</td>

                {/* Swiggy */}
                <td className="px-4 py-3 text-center text-gray-900">
                  {saleType === "KG" ? row.swiggy.quantity.toFixed(2) : row.swiggy.quantity}
                </td>
                <td className="px-4 py-3 text-center text-gray-900">₹{row.swiggy.value.toLocaleString()}</td>

                {/* Dining */}
                <td className="px-4 py-3 text-center text-gray-900">
                  {saleType === "KG" ? row.dining.quantity.toFixed(2) : row.dining.quantity}
                </td>
                <td className="px-4 py-3 text-center text-gray-900">₹{row.dining.value.toLocaleString()}</td>

                {/* Parcel */}
                <td className="px-4 py-3 text-center text-gray-900">
                  {saleType === "KG" ? row.parcel.quantity.toFixed(2) : row.parcel.quantity}
                </td>
                <td className="px-4 py-3 text-center text-gray-900">₹{row.parcel.value.toLocaleString()}</td>

                {/* Total */}
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  {saleType === "KG" ? row.total.quantity.toFixed(2) : row.total.quantity}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  ₹{row.total.value.toLocaleString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500 font-medium">
                  No sales data available
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-purple-50 border-t-2 border-purple-200 font-semibold text-gray-900">
              <td colSpan={2} className="px-4 py-3">
                TOTAL
              </td>

              {/* Zomato */}
              <td className="px-4 py-3 text-center">
                {saleType === "KG" ? totals.zomatoQty.toFixed(2) : totals.zomatoQty}
              </td>
              <td className="px-4 py-3 text-center">₹{totals.zomatoValue.toLocaleString()}</td>

              {/* Swiggy */}
              <td className="px-4 py-3 text-center">
                {saleType === "KG" ? totals.swiggyQty.toFixed(2) : totals.swiggyQty}
              </td>
              <td className="px-4 py-3 text-center">₹{totals.swiggyValue.toLocaleString()}</td>

              {/* Dining */}
              <td className="px-4 py-3 text-center">
                {saleType === "KG" ? totals.diningQty.toFixed(2) : totals.diningQty}
              </td>
              <td className="px-4 py-3 text-center">₹{totals.diningValue.toLocaleString()}</td>

              {/* Parcel */}
              <td className="px-4 py-3 text-center">
                {saleType === "KG" ? totals.parcelQty.toFixed(2) : totals.parcelQty}
              </td>
              <td className="px-4 py-3 text-center">₹{totals.parcelValue.toLocaleString()}</td>

              {/* Total */}
              <td className="px-4 py-3 text-center">
                {saleType === "KG" ? totals.totalQty.toFixed(2) : totals.totalQty}
              </td>
              <td className="px-4 py-3 text-center">₹{totals.totalValue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
              Grand Total Sale
            </p>
            <p className="text-sm font-medium text-gray-600">
              {itemName}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex flex-col sm:items-end">
              <p className="text-3xl font-black text-primary">
                {totals.totalQty.toFixed(2)}
                <span className="text-sm ml-1 uppercase">{saleType === "KG" ? "KG" : "qty"}</span>
              </p>
              <p className="text-xl font-bold text-accent-orange">
                ₹{totals.totalValue.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-primary/60 font-semibold mt-1">
              (Zomato + Swiggy + Dining + Parcel)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

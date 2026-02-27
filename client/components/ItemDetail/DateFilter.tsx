import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

interface DateFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

export default function DateFilter({ onDateRangeChange }: DateFilterProps) {
  // Initialize with proper local timezone handling
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default to last 365 days to capture more data
  const [startDate, setStartDate] = useState(() =>
    getLocalDateString(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
  );
  const [endDate, setEndDate] = useState(() =>
    getLocalDateString(new Date())
  );

  // Call the callback on component mount with initial dates (only once)
  useEffect(() => {
    onDateRangeChange(startDate, endDate);
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    onDateRangeChange(newStartDate, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    onDateRangeChange(startDate, newEndDate);
  };

  const handlePresetRange = (days: number) => {
    const newEndDate = new Date().toISOString().split('T')[0];
    const newStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    onDateRangeChange(newStartDate, newEndDate);
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 xs:p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 xs:mb-4">
        <Calendar className="w-4 xs:w-5 h-4 xs:h-5 text-primary" />
        <h3 className="text-base xs:text-lg sm:text-lg font-bold text-gray-900">Date Range</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 mb-3 xs:mb-4">
        {/* Start Date */}
        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 text-xs xs:text-sm border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs xs:text-sm font-semibold text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 text-xs xs:text-sm border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
        </div>

        {/* Summary */}
        <div className="flex items-end">
          <div className="bg-primary/5 rounded-lg p-2 xs:p-3 w-full border border-primary/20">
            <p className="text-[8px] xs:text-xs font-semibold text-primary uppercase">Selected Range</p>
            <p className="text-xs xs:text-sm font-semibold text-gray-900 mt-1 truncate">
              {startDate}
            </p>
            <p className="text-xs xs:text-sm font-semibold text-gray-900 truncate">
              to {endDate}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <p className="text-[8px] xs:text-xs font-semibold text-gray-600 uppercase mb-2 xs:mb-3">Quick Select</p>
        <div className="flex flex-wrap gap-1.5 xs:gap-2">
          <button
            onClick={() => handlePresetRange(7)}
            className="px-2 xs:px-3 py-1.5 xs:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs xs:text-sm font-medium transition"
          >
            7d
          </button>
          <button
            onClick={() => handlePresetRange(30)}
            className="px-2 xs:px-3 py-1.5 xs:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs xs:text-sm font-medium transition"
          >
            30d
          </button>
          <button
            onClick={() => handlePresetRange(90)}
            className="px-2 xs:px-3 py-1.5 xs:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs xs:text-sm font-medium transition"
          >
            90d
          </button>
          <button
            onClick={() => handlePresetRange(365)}
            className="px-2 xs:px-3 py-1.5 xs:py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs xs:text-sm font-medium transition"
          >
            1y
          </button>
        </div>
      </div>
    </div>
  );
}

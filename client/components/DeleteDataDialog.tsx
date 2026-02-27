import { useState } from "react";
import { Lock, AlertTriangle } from "lucide-react";

interface DeleteDataDialogProps {
  isVisible: boolean;
  month: string;
  year: number;
  type: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function DeleteDataDialog({
  isVisible,
  month,
  year,
  type,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteDataDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isVisible) return null;

  const handleConfirm = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setError("");
      await onConfirm(password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete data");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-red-900">Delete Data</h2>
              <p className="text-sm text-red-700 mt-1">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              You are about to permanently delete all <strong>{type}</strong> data for:
            </p>
            <p className="text-base font-bold text-red-900 mt-2">
              {month} {year}
            </p>
            <p className="text-xs text-red-700 mt-2">
              All records for this month will be completely removed from the database.
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Password to Confirm
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !password}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {isLoading ? "Deleting..." : "Delete Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

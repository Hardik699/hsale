import { Upload } from "lucide-react";

interface UploadLoaderProps {
  isVisible: boolean;
  progress?: number; // 0-100
}

export default function UploadLoader({ isVisible, progress = 0 }: UploadLoaderProps) {
  if (!isVisible) return null;

  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        {/* Animated Upload Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            {/* Outer rotating circle */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"></div>

            {/* Middle pulsing circle */}
            <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-pulse"></div>

            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary animate-bounce" style={{ animationDuration: "1.5s" }} />
            </div>
          </div>
        </div>

        {/* Text */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Uploading Data
        </h3>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Please wait while your file is being processed...
        </p>

        {/* Progress Bar with Percentage */}
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent-teal rounded-full transition-all duration-300"
              style={{
                width: `${normalizedProgress}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs font-medium text-gray-600">Processing file...</span>
            <span className="text-sm font-bold text-primary">{Math.round(normalizedProgress)}%</span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: "dot-bounce 1.4s infinite",
              animationDelay: "0s"
            }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: "dot-bounce 1.4s infinite",
              animationDelay: "0.2s"
            }}
          ></div>
          <div
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: "dot-bounce 1.4s infinite",
              animationDelay: "0.4s"
            }}
          ></div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

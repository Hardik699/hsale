import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  console.log("🚨 NotFound page rendered for route:", location.pathname);
  console.log("This means React Router didn't match any route");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-accent-purple to-accent-teal flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent-purple px-8 py-16 text-center">
            <h1 className="text-7xl font-bold text-white mb-4">404</h1>
            <p className="text-white/90 text-lg">Page Not Found</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-700 mb-2 font-medium">
                The page you're looking for doesn't exist
              </p>
              <p className="text-gray-500 text-sm">
                Route: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{location.pathname}</code>
              </p>
            </div>

            {/* Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                Here's what you can do:
              </p>
              <ul className="text-sm text-blue-800 space-y-2 ml-4 list-disc">
                <li>Return to the home page</li>
                <li>Go back to the previous page</li>
                <li>Check the URL for typos</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-semibold transition"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-xs">
              If you believe this is an error, please check your URL and try again
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

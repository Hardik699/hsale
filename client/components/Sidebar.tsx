import { Link, useLocation } from "react-router-dom";
import { Upload, Package, LogOut, Home, FileText, Star, HelpCircle, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const NAVIGATION = [
  { id: "dashboard", label: "Data Upload", href: "/dashboard", icon: Upload },
  { id: "items", label: "Items", href: "/items", icon: Package },
];

const SECONDARY_NAV = [
  { id: "docs", label: "Documentation", icon: FileText },
  { id: "examples", label: "Examples", icon: Star },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const username = localStorage.getItem("username") || "Admin";

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <aside className={`${isExpanded ? "w-64" : "w-20"} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 h-screen sticky top-0`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-lg p-2 flex-shrink-0">
            <Upload className="w-5 h-5 text-black" />
          </div>
          {isExpanded && (
            <div>
              <h1 className="text-white font-black text-lg">Data Portal</h1>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar - Only when expanded */}
      {isExpanded && (
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-600 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {NAVIGATION.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500 text-black"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="font-semibold text-sm">{item.label}</span>}
            </Link>
          );
        })}

        {isExpanded && <div className="my-4 border-t border-gray-800"></div>}

        {/* Secondary Navigation */}
        {isExpanded && (
          <>
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">Dashboards</p>
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href="#"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-all duration-300 text-sm"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-800 p-3 space-y-2">
        {/* Settings & Help */}
        {isExpanded && (
          <div className="space-y-2 mb-4">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition text-sm">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </a>
          </div>
        )}

        {/* User Profile */}
        {isExpanded && (
          <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{username}</p>
                <p className="text-gray-400 text-xs">Admin</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-950 hover:text-red-300 rounded-lg transition text-sm ${isExpanded ? "justify-start" : "justify-center"}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && <span>Logout</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition text-sm"
        >
          {isExpanded ? "← Collapse" : "→"}
        </button>
      </div>
    </aside>
  );
}

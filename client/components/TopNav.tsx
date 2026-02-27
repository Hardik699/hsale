import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Upload, Package, LogOut, Moon, Sun } from "lucide-react";

const NAVIGATION = [
  { id: "dashboard", label: "Data Upload", href: "/dashboard", icon: Upload },
  { id: "items", label: "Items", href: "/items", icon: Package },
];

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const shouldBeDark = savedTheme === "dark"; // Default to light theme (false)
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, []);

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    applyTheme(newDark);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <header className={`w-full transition-all duration-300 shadow-lg ${
      isDark
        ? "bg-slate-900 text-white border-b-2 border-slate-700"
        : "bg-white text-slate-900 border-b-2 border-slate-200"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-lg sm:text-xl font-bold text-blue-600 hover:scale-105 transition-transform duration-300 cursor-pointer whitespace-nowrap">
          📊 Data Portal
        </h1>

        {/* Navigation Links */}
        <div className="flex items-center gap-2">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : isDark
                    ? "text-slate-300 hover:text-white hover:bg-slate-700/40"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
                <span className="hidden sm:inline">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-orange-500 animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle & Logout */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 hover:scale-105 ${
              isDark
                ? "bg-slate-800/70 text-yellow-400 hover:bg-slate-700 shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-sm"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 animate-spin" style={{animationDuration: '3s'}} /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 hover:scale-105 group ${
              isDark
                ? "text-slate-300 hover:text-white hover:bg-red-600/20"
                : "text-slate-600 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

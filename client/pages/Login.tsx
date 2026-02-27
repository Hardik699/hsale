import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Simple authentication check
    if (username === "admin" && password === "admin1") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } else {
      setError("Invalid credentials. Try admin / admin1");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600 rounded-full opacity-5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-32 right-20 w-80 h-80 bg-emerald-500 rounded-full opacity-5 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }}></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md animate-float-in">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header Section */}
          <div className="px-8 py-10 text-center border-b border-gray-800">
            <div className="mb-4 inline-flex p-3 bg-emerald-500 rounded-lg">
              <Lock className="w-6 h-6 text-black font-bold" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Data Portal
            </h1>
            <p className="text-gray-400 text-sm">Sign in</p>
            <p className="text-gray-500 text-xs mt-2">Don't have an account yet? Sign up here</p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="animate-float-in p-3 bg-red-950 border border-red-800 rounded-lg">
                <p className="text-red-400 font-semibold text-sm">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2 animate-slide-in-left">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-300">
                Username or email
              </label>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "username" ? "scale-105" : ""
                }`}
              >
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="danielPetrova"
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 focus:bg-gray-800 focus:border-blue-600 focus:outline-none disabled:opacity-60 text-gray-100 placeholder-gray-600 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                  Password
                </label>
                <a href="#" className="text-xs text-gray-500 hover:text-gray-400">
                  Forgot password?
                </a>
              </div>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  focusedField === "password" ? "scale-105" : ""
                }`}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 focus:bg-gray-800 focus:border-blue-600 focus:outline-none disabled:opacity-60 text-gray-100 placeholder-gray-600 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-blue-600 bg-gray-800 border-gray-700 rounded cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-300 cursor-pointer">
                Remember Me
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-modern w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-70 transform transition-all hover:shadow-lg hover:shadow-blue-600/50 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

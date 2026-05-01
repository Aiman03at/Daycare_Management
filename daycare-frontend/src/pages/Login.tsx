import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { setAuthSession, getToken } from "../auth/session";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      const res = await api.post("/auth/login", {
        email,
        password
      });

      setAuthSession(res.data.token, res.data.user);
      navigate("/");

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Login failed. Please check your credentials.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Header with gradient */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="p-8 md:p-10">
            {/* Logo Section */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative">
                {/* Animated background circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
                
                {/* Logo SVG */}
                <svg
                  className="relative w-20 h-20 animate-bounce-slow"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* House base */}
                  <path
                    d="M20 60L50 25L80 60V80C80 85.5228 75.5228 90 70 90H30C24.4772 90 20 85.5228 20 80V60Z"
                    fill="url(#gradient1)"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                  />
                  
                  {/* Door */}
                  <rect x="42" y="62" width="16" height="28" rx="2" fill="#FFB84D" stroke="#FF9800" strokeWidth="1.5" />
                  <circle cx="55" cy="76" r="1.5" fill="#FF9800" />
                  
                  {/* Windows */}
                  <rect x="28" y="50" width="12" height="12" rx="2" fill="#E3F2FD" stroke="#1976D2" strokeWidth="1" />
                  <line x1="34" y1="50" x2="34" y2="62" stroke="#1976D2" strokeWidth="0.5" />
                  <line x1="28" y1="56" x2="40" y2="56" stroke="#1976D2" strokeWidth="0.5" />
                  
                  <rect x="60" y="50" width="12" height="12" rx="2" fill="#E3F2FD" stroke="#1976D2" strokeWidth="1" />
                  <line x1="66" y1="50" x2="66" y2="62" stroke="#1976D2" strokeWidth="0.5" />
                  <line x1="60" y1="56" x2="72" y2="56" stroke="#1976D2" strokeWidth="0.5" />
                  
                  {/* Heart details on roof */}
                  <path
                    d="M42 35C42 33 43 32 44 32C45 32 46 33 46 34L50 31L54 34C54 33 55 32 56 32C57 32 58 33 58 35C58 37 50 42 50 42C50 42 42 37 42 35Z"
                    fill="#FF1493"
                  />
                  
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8 animate-fade-in animation-delay-200">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Little Haven
              </h1>
              <p className="text-gray-600 text-sm md:text-base font-medium">
                Where Every Child Feels at Home
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
                <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="relative animate-fade-in animation-delay-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className={`relative transition-all duration-300 ${
                  focusedField === 'email' ? 'ring-2 ring-indigo-400' : ''
                } rounded-lg`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                  />
                  <svg className="absolute right-4 top-11 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>

              {/* Password Field */}
              <div className="relative animate-fade-in animation-delay-400">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className={`relative transition-all duration-300 ${
                  focusedField === 'password' ? 'ring-2 ring-indigo-400' : ''
                } rounded-lg`}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                  />
                  <svg className="absolute right-4 top-11 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-fade-in animation-delay-500 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Footer text */}
            <div className="mt-8 text-center animate-fade-in animation-delay-600">
              <p className="text-gray-600 text-sm">
                Daycare Management System
              </p>
              <p className="text-gray-400 text-xs mt-2">
                © 2024 Little Haven. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

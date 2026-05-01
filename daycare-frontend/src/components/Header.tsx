import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../auth/session";
import { useState } from "react";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const titles: Record<string, string> = {
    "/": "Dashboard",
    "/children": "Children",
    "/attendance": "Attendance",
    "/activities": "Activities",
    "/meals": "Meals",
    "/toilets": "Toilets",
    "/incidents": "Incident / Accident",
    "/health": "Health",
    "/supplies": "Supplies",
    "/sleep": "Sleep",
    "/add-new": "Add New",
  };

  const displayName = user?.name || user?.email || "Guest";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {titles[location.pathname] ?? "Little Haven"}
        </h1>
        <p className="text-sm text-slate-500">Where every Child feels at home</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{displayName}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{displayRole}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold shadow-md">
            {avatarLetter}
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200"></div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium text-sm transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100"
        >
          {isLoggingOut ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing Out...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </>
          )}
        </button>
      </div>
    </div>
  );
}

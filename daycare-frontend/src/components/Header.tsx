import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../auth/session";
import { useEffect, useState } from "react";
import { api } from "../api/client";

interface MessageSummary {
  unread_count?: number;
  is_read?: boolean;
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
    "/messages": "Messages",
  };

  const displayName = user?.name || user?.email || "Guest";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await api.get<MessageSummary[]>("/messages", {
          params: { archived: false },
        });

        const count = response.data.reduce((total, message) => {
          if (typeof message.unread_count === "number") {
            return total + message.unread_count;
          }

          if (message.is_read === false) {
            return total + 1;
          }

          return total;
        }, 0);

        setUnreadCount(count);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnreadCount();
  }, [location.pathname]);

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
          <button
            onClick={() => navigate("/messages")}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              location.pathname === "/messages"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            aria-label="Open messages"
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h8m-8 4h5m-7 6l-4 2V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H8z"
                />
              </svg>
              <span>Messages</span>
              {unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
          </button>

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

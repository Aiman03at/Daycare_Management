import { useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../auth/session";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

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

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {titles[location.pathname] ?? "Little Haven"}
        </h1>
        <p className="text-sm text-slate-500">Where every Child feels at home</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{displayName}</p>
          <p className="text-xs uppercase tracking-wide text-slate-500">{displayRole}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
          {avatarLetter}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

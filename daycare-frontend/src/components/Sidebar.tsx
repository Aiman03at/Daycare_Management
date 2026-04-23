import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Activities", path: "/activities" },
    { name: "Children", path: "/children" },
    { name: "Attendance", path: "/attendance" },
  ];

  return (
    <div className="w-72 border-r border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-rose-300 to-sky-300 text-lg font-bold text-slate-900 shadow-sm">
            LH
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Centre
            </p>
            <div className="mt-1 text-xl font-bold text-slate-900">Little Haven</div>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Where every Child feels at home
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

import { Link, NavLink } from "react-router-dom";

import Button from "../ui/Button.jsx";
import useAuth from "../../hooks/useAuth.js";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Interviews", to: "/interview/history" },
  { label: "Resume", to: "/resume/upload" },
  { label: "Analytics", to: "/analytics" },
];

const ProtectedLayout = ({ children }) => {
  const { userInfo, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link to="/dashboard" className="text-lg font-bold tracking-normal">
              AI Interview Coach
            </Link>

            <Button
              type="button"
              onClick={logout}
              variant="danger"
              size="sm"
              className="md:hidden"
            >
              Logout
            </Button>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="max-w-48 truncate text-right text-sm text-slate-300">
              {userInfo?.name || userInfo?.email || "User"}
            </div>

            <Button
              type="button"
              onClick={logout}
              variant="danger"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
};

export default ProtectedLayout;

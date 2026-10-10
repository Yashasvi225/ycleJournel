import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  History,
  Sparkles,
  ShieldCheck,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import { useState } from "react";
import Logo from "./Logo";
import { api, clearSession } from "../api";

const items = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Calendar", "/calendar", CalendarDays],
  ["Add Entry", "/entry", PlusCircle],
  ["History", "/history", History],
  ["Insights", "/insights", Sparkles],
  ["Privacy Center", "/privacy", ShieldCheck],
  ["Settings", "/settings", Settings],
];

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) return;

    try {
      await api("/auth/logout", {
        method: "POST",
      });
    } catch {
      // Local session is still cleared if server logout fails.
    }

    clearSession();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {/* MOBILE HEADER */}

      <header className="mobile-header sticky top-0 z-40 flex items-center justify-between border-b p-4 md:hidden">
        <Logo />

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl p-2"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>

      {/* MOBILE OVERLAY */}

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          app-sidebar
          fixed inset-y-0 left-0 z-30
          w-64 p-5
          transition-transform duration-200
          md:translate-x-0 md:pt-7
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Logo light />

        <nav
          className="app-navigation mt-9 space-y-1"
          aria-label="Main navigation"
        >
          {items.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3
                text-sm font-medium
                ${
                  isActive
                    ? "bg-white text-black"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />

              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="app-logout absolute bottom-6 left-5 right-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/20"
        >
          <LogOut size={17} aria-hidden="true" />
          Log out
        </button>
      </aside>

      {/* PAGE CONTENT */}

      <main className="app-main p-5 md:ml-64 md:p-9 lg:p-12">
        {children}
      </main>
    </div>
  );
}
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Columns, List, Building2, Calendar,
  BarChart3, Users, Settings, ChevronLeft, ChevronRight, Cog,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NAV: Array<{ to: string; label: string; icon: React.ComponentType<{ size: number }>; adminOnly?: boolean }> = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Lead Pipeline", icon: Columns },
  { to: "/leads", label: "All Leads", icon: List },
  { to: "/clients", label: "Clients", icon: Building2 },
  { to: "/tasks", label: "Tasks & Follow-ups", icon: Calendar },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/team", label: "Team Management", icon: Users, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className="flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-200"
      style={{ width: collapsed ? 72 : 240 }}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="grid size-8 place-items-center rounded-md bg-primary text-white">
          <Cog size={16} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-bold">Forge</div>
            <div className="text-[10px] text-slate-400">Manufacturing</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {NAV.map((item) => {
          if (item.adminOnly && role !== "admin") return null;
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active
                  ? "bg-primary text-white"
                  : "text-slate-300 hover:bg-sidebar-accent hover:text-white"
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center gap-2 border-t border-sidebar-border py-3 text-xs text-slate-400 hover:text-white"
      >
        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
      </button>
    </aside>
  );
}

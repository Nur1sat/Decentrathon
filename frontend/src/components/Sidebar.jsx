import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  BarChart3,
  Brain,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { section: "OVERVIEW" },
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/candidates", icon: UserCheck, label: "Кандидаты" },
  { section: "АНАЛИТИКА" },
  { path: "/stats", icon: BarChart3, label: "Статистика" },
  { path: "/ai-insights", icon: Brain, label: "AI Инсайты" },
  { section: "СИСТЕМА" },
  { path: "/settings", icon: Settings, label: "Настройки" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface-200 border-r border-surface-400 min-h-screen p-5 fixed left-0 top-0 z-20">
      {/* Logo */}
      <div 
        className="flex items-center gap-3 mb-10 cursor-pointer" 
        onClick={() => navigate("/")}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#C1F11D]">
          <Zap size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">HI PO</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item, i) =>
          item.section ? (
            <p key={i} className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mt-6 mb-2 px-4">
              {item.section}
            </p>
          ) : (
            <div
              key={i}
              onClick={() => navigate(item.path)}
              className={`sidebar-link ${
                (location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)))
                  ? "active" 
                  : ""
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="ml-auto badge bg-neon-red/20 text-neon-red text-[10px]">
                  {item.badge}
                </span>
              )}
            </div>
          )
        )}
      </nav>
    </aside>
  );
}

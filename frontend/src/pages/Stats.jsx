import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Zap, 
  Bot, 
  Globe, 
  MessageSquare,
  Loader2,
  TrendingUp,
  Brain
} from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import { getStats } from "../api/client.js";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-black text-white tabular-nums">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-surface-300 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <BarChart3 className="text-[#C1F11D]" size={32} />
            Общая Статистика
          </h1>
          <p className="text-gray-500 mt-2">Анализ потока кандидатов и эффективности воронки</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            label="Всего заявок" 
            value={stats.total_candidates} 
            icon={Users} 
            color="text-[#C1F11D]"
          />
          <StatCard 
            label="Проанализировано" 
            value={stats.scored} 
            icon={Zap} 
            color="text-[#C1F11D]"
          />
          <StatCard 
            label="Средний балл" 
            value={stats.avg_overall_score} 
            icon={TrendingUp} 
            color="text-[#C1F11D]"
          />
          <StatCard 
            label="AI Флаги" 
            value={stats.ai_flagged} 
            icon={Bot} 
            color="text-red-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sources breakdown */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Globe size={18} className="text-[#C1F11D]" />
              Источники трафика
            </h2>
            <div className="space-y-6">
              {Object.entries(stats.by_source || {}).map(([source, count]) => (
                <div key={source}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300 capitalize">
                      {source.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-400 rounded-full"
                      style={{ width: `${(count / stats.total_candidates) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="card p-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Brain size={18} className="text-[#C1F11D]" />
              Быстрые Инсайты
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-300 border border-surface-400">
                <p className="text-sm text-gray-300">
                  <span className="text-primary-400 font-bold">↑ 12%</span> рост активности за последние 24 часа.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-300 border border-surface-400">
                <p className="text-sm text-gray-300">
                  <span className="text-[#C1F11D] font-bold">Лидерство</span> — самая сильная компетенция в текущем потоке.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-surface-300 border border-surface-400">
                <p className="text-sm text-gray-300">
                  <span className="text-red-400 font-bold">{Math.round((stats.ai_flagged / stats.total_candidates) * 100)}%</span> заявок помечены как потенциальный AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Bot,
  RefreshCw,
  Zap,
  Brain,
  Search,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import { getCandidates, scoreCandidate } from "../api/client.js";
import CandidateTable from "../components/CandidateTable.jsx";



function StatCard({ icon: Icon, label, value, sub, variant = "default" }) {
  const variants = {
    default: "card",
    green: "card-glow-green",
    cyan: "card-glow-cyan",
    red: "card-glow-red",
  };

  const iconColors = {
    default: "text-gray-400 bg-surface-300",
    green: "text-primary bg-primary/10",
    cyan: "text-neon-cyan bg-neon-cyan/10",
    red: "text-neon-red bg-neon-red/10",
  };

  const numColors = {
    default: "text-white",
    green: "text-primary",
    cyan: "text-neon-cyan",
    red: "text-neon-red",
  };

  return (
    <div className={`${variants[variant]} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
          <p className={`stat-number ${numColors[variant]}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${iconColors[variant]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-300 mb-4">
        <Users size={28} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Кандидатов пока нет</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Запустите seed-скрипт на бэкенде.
      </p>
      <pre className="mt-4 inline-block text-xs bg-surface-300 border border-surface-400 text-primary px-4 py-3 rounded-xl">
        cd backend && python seed_data.py
      </pre>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoringAll, setScoringAll] = useState(false);
  const location = useLocation();
  const initFilter = location.pathname.includes("/candidates") ? "accepted" : "all";
  const [filter, setFilter] = useState(initFilter);

  useEffect(() => {
    if (location.pathname.includes("/candidates")) {
      setFilter("accepted");
    } else {
      setFilter("all");
    }
  }, [location.pathname]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreAll = async () => {
    setScoringAll(true);
    setScoringProgress(0);
    const ids = candidates.map((c) => c.id);
    for (let i = 0; i < ids.length; i++) {
      try {
        await scoreCandidate(ids[i]);
      } catch (_) {}
      setScoringProgress(i + 1);
    }
    setScoringAll(false);
    setScoringProgress(null);
    await load();
  };

  useEffect(() => {
    load();
  }, []);

  const scored = candidates.filter((c) => c.latest_score);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.latest_score.overall_score, 0) / scored.length)
    : 0;
  const flaggedAI = scored.filter((c) => c.latest_score.ai_probability > 60).length;

  const filteredCandidates = candidates.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div className="min-h-screen bg-surface-100">
      <Sidebar />

      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="border-b border-surface-400 bg-surface-100/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Добро пожаловать 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                HI PO Intelligence · Скоринг потенциала кандидатов
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 bg-surface-300 border border-surface-400 rounded-xl px-4 py-2.5">
                <Search size={14} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Поиск кандидатов..."
                  className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none w-48"
                />
              </div>
              {/* Score all button */}
              <button
                onClick={handleScoreAll}
                disabled={scoringAll || candidates.length === 0}
                className="btn-primary text-xs gap-1.5"
              >
                {scoringAll ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                {scoringAll
                  ? `Анализ ${scoringProgress}/${candidates.length}...`
                  : "Проанализировать всех"}
              </button>
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Всего кандидатов"
              value={candidates.length}
              sub={`${scored.length} проанализировано`}
              variant="default"
            />
            <StatCard
              icon={TrendingUp}
              label="Средний балл"
              value={scored.length ? avgScore : "—"}
              sub="по всем осям"
              variant="green"
            />
            <StatCard
              icon={Bot}
              label="AI Флаги"
              value={flaggedAI}
              sub="вероятность AI > 60%"
              variant={flaggedAI > 0 ? "red" : "default"}
            />
            <StatCard
              icon={Brain}
              label="Средняя аутентичность"
              value={scored.length ? Math.round(scored.reduce((s, c) => s + c.latest_score.authenticity_index, 0) / scored.length) + "%" : "—"}
              sub="живой голос vs AI"
              variant="cyan"
            />
          </div>

          {/* Main content */}
          <div className="card overflow-hidden">
            <div className="px-6 py-5 border-b border-surface-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-[#C1F11D]" />
                <h2 className="font-semibold text-white text-base">Список кандидатов</h2>
                {candidates.length > 0 && (
                  <span className="badge bg-[#C1F11D]/10 text-[#C1F11D] text-[10px] border border-[#C1F11D]/20">
                    {candidates.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setFilter("all")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "all" ? "bg-surface-400 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  Все
                </button>
                <button 
                  onClick={() => setFilter("pending")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "pending" ? "bg-surface-400 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  Ожидают
                </button>
                <button 
                  onClick={() => setFilter("accepted")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "accepted" ? "bg-surface-400 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  Зачислены
                </button>
                <button 
                  onClick={() => setFilter("rejected")} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === "rejected" ? "bg-surface-400 text-white" : "text-gray-500 hover:text-white"}`}
                >
                  Отклонены
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw size={24} className="animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-neon-red font-medium mb-2">Ошибка загрузки данных</p>
                <p className="text-gray-500 text-sm mb-4">{error}</p>
                <button onClick={() => load()} className="btn-primary text-xs">
                  Попробовать снова
                </button>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <EmptyState />
            ) : (
              <CandidateTable candidates={filteredCandidates} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

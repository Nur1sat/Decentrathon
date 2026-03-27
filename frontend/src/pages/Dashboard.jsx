import React, { useState, useEffect } from "react";
import { Users, TrendingUp, Bot, RefreshCw, Eye } from "lucide-react";
import { getCandidates } from "../api/client.js";
import CandidateTable from "../components/CandidateTable.jsx";

function StatCard({ icon, label, value, sub, color = "text-primary-400" }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg bg-surface-300 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm font-medium text-gray-300 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-300 mb-4">
        <Users size={28} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">Кандидатов пока нет</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Запустите seed-скрипт на бэкенде, чтобы заполнить базу тестовыми кандидатами.
      </p>
      <pre className="mt-4 inline-block text-xs bg-surface-300 border border-surface-400 text-green-400 px-4 py-3 rounded-lg">
        cd backend && python seed_data.py
      </pre>
    </div>
  );
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scored = candidates.filter((c) => c.latest_score);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.latest_score.overall_score, 0) / scored.length)
    : 0;
  const flaggedAI = scored.filter((c) => c.latest_score.ai_probability > 60).length;

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Header */}
      <header className="border-b border-surface-400 bg-surface-200/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
              <Eye size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">inVision Lens</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Интеллектуальный скоринг потенциала</p>
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-xs gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<Users size={20} />}
            label="Всего кандидатов"
            value={candidates.length}
            sub={`${scored.length} проанализировано`}
            color="text-primary-400"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Средний балл"
            value={scored.length ? avgScore : "—"}
            sub="по всем осям"
            color="text-green-400"
          />
          <StatCard
            icon={<Bot size={20} />}
            label="Флаг AI-контента"
            value={flaggedAI}
            sub="вероятность AI > 60%"
            color="text-orange-400"
          />
        </div>

        {/* Main content */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-400 flex items-center justify-between">
            <h2 className="font-semibold text-gray-200">Список кандидатов</h2>
            {candidates.length > 0 && (
              <span className="text-xs text-gray-500">
                Нажмите на строку для подробной аналитики
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-primary-400" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-400 font-medium mb-2">Ошибка загрузки данных</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button onClick={() => load()} className="btn-primary text-xs">
                Попробовать снова
              </button>
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState />
          ) : (
            <CandidateTable candidates={candidates} />
          )}
        </div>
      </main>
    </div>
  );
}

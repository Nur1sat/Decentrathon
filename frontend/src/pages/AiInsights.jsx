import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Activity,
  Zap,
  ChevronRight
} from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import { getCandidates } from "../api/client.js";
import { useNavigate } from "react-router-dom";

export default function AiInsights() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates()
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, []);

  const flagged = candidates.filter(c => c.latest_score && c.latest_score.ai_probability > 60);

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
            <Brain className="text-[#C1F11D]" size={32} />
            AI Инсайты
          </h1>
          <p className="text-gray-500 mt-2">Глубокий анализ безопасности и качества заявок</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main risk stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-8 bg-red-500/5 border-red-500/20">
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                Зона Риска
              </h2>
              <div className="text-5xl font-black text-white mb-2">{flagged.length}</div>
              <p className="text-sm text-gray-400">Кандидатов помечаны как подозрительные (AI Risk &gt; 60%)</p>
            </div>

            <div className="card p-8">
              <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-6 border-b border-surface-400 pb-4">
                <Zap size={16} className="text-[#C1F11D] inline-block mr-2" />
                Технологии проверки
              </h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-[#C1F11D]/10 text-[#C1F11D]">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Биометрика</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Ритм печати и использование буфера обмена замеряются в реальном времени.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary-400/10 text-primary-400">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">AI Detection</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Llama 3.3 анализирует структуру и логическую последовательность текста.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary-400/10 text-primary-400">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Verification Loop</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">Контекстные вопросы через Telegram для финальной проверки личности.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Suspicious Candidates List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="p-6 border-b border-surface-400 font-bold text-white">Список критических алертов</div>
            <div className="divide-y divide-surface-400">
              {flagged.length === 0 ? (
                <div className="p-10 text-center">
                  <CheckCircle size={40} className="text-primary mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Все кандидаты прошли первичную проверку чисто.</p>
                </div>
              ) : (
                flagged.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    className="p-6 hover:bg-surface-300 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">{c.full_name}</h3>
                        <p className="text-xs text-gray-500">{c.city} · {c.age} лет</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                            AI Risk: {Math.round(c.latest_score.ai_probability)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-600 transition-transform group-hover:translate-x-1" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

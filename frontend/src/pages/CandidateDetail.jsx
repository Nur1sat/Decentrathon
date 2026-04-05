import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowLeft,
  Eye,
  Loader2,
  Play,
  CheckCircle,
  AlertTriangle,
  Quote,
  Star,
  TrendingUp,
  Brain,
  Zap,
  RefreshCw,
} from "lucide-react";
import { getCandidate, scoreCandidate } from "../api/client.js";
import Sidebar from "../components/Sidebar.jsx";
import RadarChart from "../components/RadarChart.jsx";
import AuthenticityHighlight from "../components/AuthenticityHighlight.jsx";
import FeedbackButton from "../components/FeedbackButton.jsx";
import PotentialTriggers from "../components/PotentialTriggers.jsx";

const SCHOOL_TYPE_CONFIG = {
  elite:   { label: "Элитная школа",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  regular: { label: "Городская школа", color: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
  rural:   { label: "Сельская школа",  color: "text-green-400 bg-green-500/10 border-green-500/30" },
};

const SCORE_AXES = [
  {
    key: "hard_skills_score",
    label: "Hard Skills",
    desc: "Формальные достижения: олимпиады, проекты, оценки",
    icon: <Star size={15} />,
    color: "bg-indigo-500",
    textColor: "text-indigo-400",
  },
  {
    key: "growth_trajectory",
    label: "Траектория роста",
    desc: "Результаты с учётом стартовых условий и типа школы",
    icon: <TrendingUp size={15} />,
    color: "bg-green-500",
    textColor: "text-green-400",
  },
  {
    key: "leadership_potential",
    label: "Лидерский потенциал",
    desc: "Инициатива, влияние на других, активная позиция",
    icon: <Brain size={15} />,
    color: "bg-violet-500",
    textColor: "text-violet-400",
  },
  {
    key: "authenticity_index",
    label: "Аутентичность",
    desc: "Живой голос vs шаблонный/AI-сгенерированный текст",
    icon: <Eye size={15} />,
    color: "bg-cyan-500",
    textColor: "text-cyan-400",
  },
];

function ScoreBar({ value, colorClass }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className="score-bar w-full">
      <div className={clsx("score-bar-fill", colorClass)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function OverallScoreBadge({ value }) {
  const color =
    value >= 70
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : value >= 50
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";
  return (
    <div className={clsx("inline-flex flex-col items-center px-5 py-3 rounded-xl border", color)}>
      <span className="text-4xl font-bold tabular-nums">{Math.round(value)}</span>
      <span className="text-xs font-medium mt-0.5 opacity-80">Общий балл</span>
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidate(id);
      setCandidate(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleScore = async () => {
    setScoring(true);
    setError(null);
    try {
      await scoreCandidate(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-400" />
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => navigate("/")} className="btn-secondary">
          <ArrowLeft size={15} /> На главную
        </button>
      </div>
    );
  }

  if (!candidate) return null;

  const latestScore =
    candidate.scores && candidate.scores.length > 0
      ? candidate.scores[candidate.scores.length - 1]
      : null;

  const schoolCfg = SCHOOL_TYPE_CONFIG[candidate.school_type] || SCHOOL_TYPE_CONFIG.regular;

  return (
    <div className="min-h-screen bg-surface-100 flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b border-surface-400 bg-surface-100/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="btn-secondary text-xs gap-1.5 py-1.5"
              >
                <ArrowLeft size={13} /> К списку
              </button>
            </div>
            <div className="flex items-center gap-3">
              {!latestScore && (
                <button
                  onClick={handleScore}
                  disabled={scoring}
                  className="btn-primary text-xs gap-1.5"
                >
                  {scoring ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} />
                  )}
                  {scoring ? "Анализ..." : "Запустить анализ"}
                </button>
              )}
              {latestScore && (
                <button
                  onClick={handleScore}
                  disabled={scoring}
                  className="btn-secondary text-xs gap-1.5"
                >
                  {scoring ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Повторный анализ
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Candidate header card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{candidate.full_name}</h1>
              <p className="text-gray-400 mt-1">
                {candidate.age} лет · {candidate.city}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={clsx("badge border", schoolCfg.color)}>
                  {schoolCfg.label}
                </span>
                {latestScore && (
                  <span className="badge bg-surface-300 border border-surface-400 text-gray-400 gap-1">
                    <CheckCircle size={11} className="text-green-400" />
                    Анализ завершён
                  </span>
                )}
              </div>
            </div>
            {latestScore && (
              <OverallScoreBadge value={latestScore.overall_score} />
            )}
          </div>
        </div>

        {latestScore ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Radar chart */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Zap size={15} className="text-primary-400" />
                  Профиль компетенций
                </h2>
                <RadarChart scores={latestScore} />
              </div>

              {/* Score breakdown */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-4">Детальные оценки</h2>
                <div className="space-y-4">
                  {SCORE_AXES.map((axis) => (
                    <div key={axis.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={axis.textColor}>{axis.icon}</span>
                          <span className="text-sm font-medium text-gray-300">{axis.label}</span>
                        </div>
                        <span className={clsx("text-lg font-bold tabular-nums", axis.textColor)}>
                          {Math.round(latestScore[axis.key])}
                        </span>
                      </div>
                      <ScoreBar value={latestScore[axis.key]} colorClass={axis.color} />
                      <p className="text-xs text-gray-600 mt-1">{axis.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Brain size={15} className="text-violet-400" />
                  Заключение ИИ
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">{latestScore.reasoning}</p>
              </div>

              {/* Potential triggers */}
              <PotentialTriggers triggers={latestScore.potential_triggers} />

              {/* Feedback */}
              <FeedbackButton candidateId={candidate.id} />
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Strengths */}
              {latestScore.strengths && latestScore.strengths.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle size={15} />
                    Сильные стороны
                  </h2>
                  <ul className="space-y-3">
                    {latestScore.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-green-400 text-xs font-bold">{i + 1}</span>
                        </span>
                        <p className="text-gray-300 text-sm leading-relaxed">{s}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {latestScore.risks && latestScore.risks.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    Риски
                  </h2>
                  <ul className="space-y-3">
                    {latestScore.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertTriangle size={10} className="text-red-400" />
                        </span>
                        <p className="text-gray-300 text-sm leading-relaxed">{r}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Leadership quotes */}
              {latestScore.leadership_quotes && latestScore.leadership_quotes.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-sm font-semibold text-violet-400 mb-4 flex items-center gap-2">
                    <Quote size={15} />
                    Цитаты лидерства
                  </h2>
                  <div className="space-y-3">
                    {latestScore.leadership_quotes.map((q, i) => (
                      <blockquote
                        key={i}
                        className="border-l-2 border-violet-500 pl-4 py-1"
                      >
                        <p className="text-gray-300 text-sm italic leading-relaxed">«{q}»</p>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Star size={15} className="text-primary-400" />
                  Достижения
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {candidate.achievements_text}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Not scored yet */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-300 mb-4">
                <Play size={24} className="text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Анализ не запущен</h3>
              <p className="text-gray-500 text-sm mb-5">
                Нажмите кнопку выше, чтобы запустить AI-анализ кандидата.
                Это займёт несколько секунд.
              </p>
              <button
                onClick={handleScore}
                disabled={scoring}
                className="btn-primary mx-auto"
              >
                {scoring ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Play size={15} />
                )}
                {scoring ? "Анализируем..." : "Запустить анализ"}
              </button>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Достижения</h2>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {candidate.achievements_text}
              </p>
            </div>
          </div>
        )}

        {/* Essay section — always shown */}
        <div className="card p-6 mt-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Eye size={15} className="text-accent-cyan" />
            Эссе кандидата
          </h2>
          {latestScore ? (
            <AuthenticityHighlight
              essayText={candidate.essay_text}
              aiProbability={latestScore.ai_probability}
              authenticityIndex={latestScore.authenticity_index}
              realityGrounding={latestScore.reality_grounding}
              personalExperience={latestScore.personal_experience}
              originality={latestScore.originality}
              authenticityFragments={latestScore.authenticity_fragments}
            />
          ) : (
            <div className="bg-surface-300 border border-surface-400 rounded-xl p-5 space-y-4">
              {candidate.essay_text.split(/\n+/).filter(Boolean).map((para, i) => (
                <p key={i} className="text-gray-300 text-sm leading-relaxed">{para}</p>
              ))}
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}

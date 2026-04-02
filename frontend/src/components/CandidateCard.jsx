import React from "react";
import clsx from "clsx";
import { Flame, TrendingUp, Star, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SCHOOL_TYPE_CONFIG = {
  elite:   { label: "Элитная",  color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  regular: { label: "Городская", color: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
  rural:   { label: "Сельская",  color: "text-green-400 bg-green-500/10 border-green-500/30" },
};

function ScoreBadge({ value }) {
  const color =
    value >= 70 ? "text-green-400" : value >= 50 ? "text-amber-400" : "text-red-400";
  return (
    <span className={clsx("text-2xl font-bold tabular-nums", color)}>
      {Math.round(value)}
    </span>
  );
}

function MiniBar({ value, color = "bg-primary-500" }) {
  return (
    <div className="score-bar w-full">
      <div
        className={clsx("score-bar-fill", color)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function CandidateCard({ candidate, onClick }) {
  const navigate = useNavigate();
  const score = candidate.latest_score;
  const schoolCfg = SCHOOL_TYPE_CONFIG[candidate.school_type] || SCHOOL_TYPE_CONFIG.regular;

  const handleClick = () => {
    if (onClick) onClick(candidate);
    else navigate(`/candidates/${candidate.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="card p-4 cursor-pointer hover:border-primary-600/60 hover:bg-surface-300 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate group-hover:text-primary-300 transition-colors">
            {candidate.full_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {candidate.age} лет · {candidate.city}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {score ? (
            <ScoreBadge value={score.overall_score} />
          ) : (
            <span className="text-gray-600 text-sm">—</span>
          )}
          {score && score.ai_probability > 60 && (
            <span className="flex items-center gap-1 text-orange-400 text-xs">
              <Flame size={12} />
              AI {Math.round(score.ai_probability)}%
            </span>
          )}
        </div>
      </div>

      <div className="mb-3">
        <span className={clsx("badge border text-xs", schoolCfg.color)}>
          {schoolCfg.label}
        </span>
      </div>

      {score ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Star size={10} className="text-primary-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Hard Skills</span>
            <MiniBar value={score.hard_skills_score} color="bg-primary-500" />
            <span className="text-xs text-gray-400 w-6 text-right">{Math.round(score.hard_skills_score)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={10} className="text-green-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Рост</span>
            <MiniBar value={score.growth_trajectory} color="bg-green-500" />
            <span className="text-xs text-gray-400 w-6 text-right">{Math.round(score.growth_trajectory)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain size={10} className="text-violet-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Лидерство</span>
            <MiniBar value={score.leadership_potential} color="bg-violet-500" />
            <span className="text-xs text-gray-400 w-6 text-right">{Math.round(score.leadership_potential)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={10} className="text-accent-cyan flex-shrink-0" />
            <span className="text-xs text-gray-500 w-24 flex-shrink-0">Аутентичность</span>
            <MiniBar value={score.authenticity_index} color="bg-cyan-500" />
            <span className="text-xs text-gray-400 w-6 text-right">{Math.round(score.authenticity_index)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 italic">Анализ ещё не запущен</p>
      )}
    </div>
  );
}

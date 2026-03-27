import React, { useState, useMemo } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Flame,
  TrendingUp,
  Star,
  Brain,
  Zap,
} from "lucide-react";

const SCHOOL_TYPE_CONFIG = {
  elite:   { label: "Элитная",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  regular: { label: "Городская", color: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
  rural:   { label: "Сельская",  color: "text-green-400 bg-green-500/10 border-green-500/30" },
};

const SCORE_COLUMNS = [
  { key: "overall_score",        label: "Общий",        icon: <Zap size={13} />,        color: "text-primary-400" },
  { key: "hard_skills_score",    label: "Hard Skills",   icon: <Star size={13} />,       color: "text-indigo-400" },
  { key: "growth_trajectory",    label: "Рост",          icon: <TrendingUp size={13} />, color: "text-green-400" },
  { key: "leadership_potential", label: "Лидерство",     icon: <Brain size={13} />,      color: "text-violet-400" },
  { key: "authenticity_index",   label: "Аутентичность", icon: <Star size={13} />,       color: "text-cyan-400" },
];

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronsUpDown size={13} className="text-gray-600" />;
  return sortDir === "asc"
    ? <ChevronUp size={13} className="text-primary-400" />
    : <ChevronDown size={13} className="text-primary-400" />;
}

function ScoreCell({ value }) {
  if (value === undefined || value === null) return <span className="text-gray-600">—</span>;
  const rounded = Math.round(value);
  const color =
    rounded >= 70 ? "text-green-400" : rounded >= 50 ? "text-amber-400" : "text-red-400";
  return <span className={clsx("text-lg font-bold tabular-nums", color)}>{rounded}</span>;
}

function MiniBar({ value, colorClass }) {
  if (value === undefined || value === null) return null;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-1.5">
      <div className="score-bar w-16">
        <div className={clsx("score-bar-fill", colorClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-6">{Math.round(value)}</span>
    </div>
  );
}

export default function CandidateTable({ candidates }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("overall_score");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const aScore = a.latest_score?.[sortKey] ?? -1;
      const bScore = b.latest_score?.[sortKey] ?? -1;
      return sortDir === "asc" ? aScore - bScore : bScore - aScore;
    });
  }, [candidates, sortKey, sortDir]);

  if (!candidates.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-400">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Кандидат</th>
            <th className="text-left py-3 px-3 text-gray-400 font-medium">Школа</th>
            {SCORE_COLUMNS.map((col) => (
              <th key={col.key} className="py-3 px-3 text-center">
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center justify-center gap-1.5 mx-auto text-gray-400 hover:text-gray-200 transition-colors font-medium"
                >
                  <span className={col.color}>{col.icon}</span>
                  <span className="text-xs">{col.label}</span>
                  <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
            ))}
            <th className="text-center py-3 px-3 text-gray-400 font-medium text-xs">AI риск</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((candidate) => {
            const score = candidate.latest_score;
            const schoolCfg = SCHOOL_TYPE_CONFIG[candidate.school_type] || SCHOOL_TYPE_CONFIG.regular;
            const aiHighRisk = score && score.ai_probability > 60;

            return (
              <tr
                key={candidate.id}
                onClick={() => navigate(`/candidates/${candidate.id}`)}
                className="border-b border-surface-400/50 cursor-pointer hover:bg-surface-300 transition-colors group"
              >
                {/* Name */}
                <td className="py-3.5 px-4">
                  <div>
                    <p className="font-medium text-white group-hover:text-primary-300 transition-colors">
                      {candidate.full_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {candidate.age} лет · {candidate.city}
                    </p>
                  </div>
                </td>
                {/* School type */}
                <td className="py-3.5 px-3">
                  <span className={clsx("badge border text-xs", schoolCfg.color)}>
                    {schoolCfg.label}
                  </span>
                </td>
                {/* Overall */}
                <td className="py-3.5 px-3 text-center">
                  <ScoreCell value={score?.overall_score} />
                </td>
                {/* Hard skills */}
                <td className="py-3.5 px-3">
                  <MiniBar value={score?.hard_skills_score} colorClass="bg-indigo-500" />
                </td>
                {/* Growth */}
                <td className="py-3.5 px-3">
                  <MiniBar value={score?.growth_trajectory} colorClass="bg-green-500" />
                </td>
                {/* Leadership */}
                <td className="py-3.5 px-3">
                  <MiniBar value={score?.leadership_potential} colorClass="bg-violet-500" />
                </td>
                {/* Authenticity */}
                <td className="py-3.5 px-3">
                  <MiniBar value={score?.authenticity_index} colorClass="bg-cyan-500" />
                </td>
                {/* AI risk */}
                <td className="py-3.5 px-3 text-center">
                  {score ? (
                    aiHighRisk ? (
                      <span className="flex items-center justify-center gap-1 text-orange-400 text-xs font-semibold">
                        <Flame size={13} />
                        {Math.round(score.ai_probability)}%
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        {Math.round(score.ai_probability)}%
                      </span>
                    )
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

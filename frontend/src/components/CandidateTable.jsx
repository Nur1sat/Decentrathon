import React from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ChevronRight, AlertTriangle, CheckCircle, XCircle, Minus, Clock } from "lucide-react";

const SCHOOL_LABELS = {
  elite:   { text: "Элитная",   cls: "text-[#C1F11D] bg-[#C1F11D]/10 border-[#C1F11D]/20" },
  regular: { text: "Городская", cls: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
  rural:   { text: "Сельская",  cls: "text-primary bg-primary/10 border-primary/20" },
};

function StatusBadge({ status }) {
  if (status === "accepted") {
    return (
      <span className="badge bg-[#C1F11D]/10 text-[#C1F11D] border border-[#C1F11D]/30 gap-1">
        <CheckCircle size={10} /> Зачислен
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="badge bg-red-500/10 text-red-400 border border-red-500/30 gap-1">
        <XCircle size={10} /> Отклонен
      </span>
    );
  }
  return (
    <span className="badge bg-surface-300 text-gray-400 border border-surface-400 gap-1">
      <Clock size={10} /> Ожидает
    </span>
  );
}

function ScorePill({ value, colorClass }) {
  if (value == null) return <span className="text-gray-600">—</span>;
  const v = Math.round(value);
  const color =
    v >= 75 ? "text-[#C1F11D]" : v >= 50 ? "text-primary" : v >= 30 ? "text-amber-400" : "text-red-400";
  return <span className={clsx("font-bold tabular-nums text-sm", color)}>{v}</span>;
}

function AiRiskBadge({ probability }) {
  if (probability == null) return <span className="text-gray-600">—</span>;
  const p = Math.round(probability);
  if (p > 60) {
    return (
      <span className="badge bg-neon-red/10 text-neon-red border border-neon-red/20 gap-1">
        <AlertTriangle size={10} /> {p}%
      </span>
    );
  }
  if (p > 30) {
    return (
      <span className="badge bg-neon-orange/10 text-neon-orange border border-neon-orange/20">
        {p}%
      </span>
    );
  }
  return (
    <span className="badge bg-primary/10 text-primary border border-primary/20 gap-1">
      <CheckCircle size={10} /> {p}%
    </span>
  );
}

function MiniBar({ value, color = "bg-primary" }) {
  if (value == null) return null;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-16 h-1 rounded-full bg-surface-400 overflow-hidden">
      <div className={clsx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CandidateTable({ candidates }) {
  const navigate = useNavigate();

  const cols = [
    { key: "name", label: "Кандидат", className: "text-left" },
    { key: "school", label: "Школа", className: "text-left" },
    { key: "status", label: "Статус", className: "text-center" },
    { key: "overall", label: "Общий", className: "text-center" },
    { key: "hard", label: "Hard Skills", className: "text-center hidden md:table-cell" },
    { key: "growth", label: "Рост", className: "text-center hidden md:table-cell" },
    { key: "lead", label: "Лидерство", className: "text-center hidden lg:table-cell" },
    { key: "auth", label: "Аутентичность", className: "text-center hidden lg:table-cell" },
    { key: "ai", label: "AI Риск", className: "text-center" },
    { key: "arrow", label: "", className: "w-10" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-400">
            {cols.map((c) => (
              <th
                key={c.key}
                className={clsx(
                  "px-5 py-3.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider",
                  c.className
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const s = c.latest_score;
            const school = SCHOOL_LABELS[c.school_type] || SCHOOL_LABELS.regular;
            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="border-b border-surface-400/50 cursor-pointer transition-all duration-200 hover:bg-surface-300/50 group"
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      {c.full_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.age} лет · {c.city}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={clsx("badge border text-[10px]", school.cls)}>
                    {school.text}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-5 py-4 text-center">
                  <ScorePill value={s?.overall_score} />
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  <ScorePill value={s?.hard_skills_score} />
                </td>
                <td className="px-5 py-4 text-center hidden md:table-cell">
                  <ScorePill value={s?.growth_trajectory} />
                </td>
                <td className="px-5 py-4 text-center hidden lg:table-cell">
                  <ScorePill value={s?.leadership_potential} />
                </td>
                <td className="px-5 py-4 text-center hidden lg:table-cell">
                  <ScorePill value={s?.authenticity_index} />
                </td>
                <td className="px-5 py-4 text-center">
                  <AiRiskBadge probability={s?.ai_probability} />
                </td>
                <td className="px-3 py-4">
                  <ChevronRight
                    size={14}
                    className="text-gray-600 group-hover:text-primary transition-colors"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import React from "react";
import clsx from "clsx";
import { Zap, Users, Flame, Lightbulb, Shield } from "lucide-react";

const TRIGGER_CONFIG = {
  leadership: {
    label: "Лидерство",
    icon: <Users size={13} />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
    dot: "bg-violet-500",
  },
  risk_taking: {
    label: "Риск",
    icon: <Flame size={13} />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    dot: "bg-orange-500",
  },
  social_impact: {
    label: "Социальный вклад",
    icon: <Shield size={13} />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    dot: "bg-green-500",
  },
  innovation: {
    label: "Инновация",
    icon: <Lightbulb size={13} />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    dot: "bg-cyan-500",
  },
  resilience: {
    label: "Стойкость",
    icon: <Zap size={13} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-500",
  },
};

export default function PotentialTriggers({ triggers }) {
  if (!triggers || triggers.length === 0) return null;

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <Zap size={15} className="text-amber-400" />
        Сигналы потенциала ({triggers.length})
      </h2>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TRIGGER_CONFIG).map(([type, cfg]) => {
          const count = triggers.filter((t) => t.trigger_type === type).length;
          if (!count) return null;
          return (
            <span
              key={type}
              className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
                cfg.bg, cfg.color
              )}
            >
              {cfg.icon}
              {cfg.label}
              <span className="opacity-60">×{count}</span>
            </span>
          );
        })}
      </div>

      {/* Trigger cards */}
      <div className="space-y-3">
        {triggers.map((t, i) => {
          const cfg = TRIGGER_CONFIG[t.trigger_type] || TRIGGER_CONFIG.leadership;
          return (
            <div
              key={i}
              className={clsx("rounded-xl border p-4 space-y-2", cfg.bg)}
            >
              <div className="flex items-center gap-2">
                <span className={clsx("flex items-center gap-1 text-xs font-semibold", cfg.color)}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
              <blockquote className="border-l-2 border-current pl-3">
                <p className={clsx("text-xs font-mono leading-relaxed", cfg.color, "opacity-90")}>
                  «{t.quote}»
                </p>
              </blockquote>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

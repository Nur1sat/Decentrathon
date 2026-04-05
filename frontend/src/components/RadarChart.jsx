import React, { useMemo } from "react";

const AXES = [
  { key: "hard_skills_score", label: "Hard Skills" },
  { key: "growth_trajectory", label: "Рост" },
  { key: "leadership_potential", label: "Лидерство" },
  { key: "authenticity_index", label: "Аутентичность" },
  { key: "originality", label: "Оригинальность" },
];

export default function RadarChart({ scores }) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const levels = 4;
  const maxR = size / 2 - 30;

  const angleStep = (2 * Math.PI) / AXES.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridLevels = useMemo(() => {
    return Array.from({ length: levels }, (_, li) => {
      const r = ((li + 1) / levels) * maxR;
      const points = AXES.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(" ");
      return points;
    });
  }, []);

  const dataPoints = AXES.map((axis, i) =>
    getPoint(i, scores[axis.key] ?? 0)
  );
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C1F11D" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.08" />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid levels */}
        {gridLevels.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {AXES.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          fill="url(#radarFill)"
          stroke="#C1F11D"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#C1F11D"
            stroke="#09090f"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {AXES.map((axis, i) => {
          const p = getPoint(i, 120);
          const val = Math.round(scores[axis.key] ?? 0);
          return (
            <g key={i}>
              <text
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                className="text-[9px] font-semibold uppercase tracking-wider"
                fill="#6b7280"
              >
                {axis.label}
              </text>
              <text
                x={p.x}
                y={p.y + 8}
                textAnchor="middle"
                className="text-[11px] font-bold"
                fill="#C1F11D"
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

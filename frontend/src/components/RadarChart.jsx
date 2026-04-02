import React from "react";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const AXES = [
  { key: "hard_skills_score", label: "Hard Skills" },
  { key: "growth_trajectory", label: "Траектория роста" },
  { key: "leadership_potential", label: "Лидерство" },
  { key: "authenticity_index", label: "Аутентичность" },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-surface-200 border border-surface-400 rounded-lg p-3 text-sm shadow-xl">
        <p className="font-semibold text-white mb-1">{d.subject}</p>
        <p className="text-primary-400 font-bold text-lg">{d.value}</p>
        <p className="text-gray-400 text-xs">из 100</p>
      </div>
    );
  }
  return null;
};

export default function RadarChart({ scores }) {
  if (!scores) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Нет данных для отображения
      </div>
    );
  }

  const data = AXES.map(({ key, label }) => ({
    subject: label,
    value: Math.round(scores[key] ?? 0),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke="#2a2a4a"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "#a5b4fc",
              fontSize: 12,
              fontWeight: 500,
            }}
            stroke="#2a2a4a"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#6b7280", fontSize: 10 }}
            stroke="#1a1a2e"
            tickCount={5}
          />
          <Radar
            name="Кандидат"
            dataKey="value"
            stroke="#818cf8"
            fill="#6366f1"
            fillOpacity={0.35}
            strokeWidth={2}
            dot={{ fill: "#a5b4fc", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#c7d2fe", strokeWidth: 0 }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

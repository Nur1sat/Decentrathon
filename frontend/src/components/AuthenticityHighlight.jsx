import React from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle, Bot } from "lucide-react";

const STERILE_PHRASES = [
  "leveraging",
  "synerg",
  "holistic",
  "dynamic ecosystem",
  "innovative solution",
  "best practices",
  "stakeholder",
  "value proposition",
  "growth mindset",
  "thought leader",
  "paradigm shift",
  "actionable insight",
  "data-driven",
  "core competenc",
  "bandwidth",
  "circle back",
  "deep dive",
  "touch base",
  "scalab",
  "impactful",
  "ecosystem",
  "end-to-end",
  "future-proof",
  "cutting-edge",
  "key driver",
  "VUCA",
  "pain point",
  "value for all stakeholders",
  "синергия",
  "драйвер роста",
  "экосистема инноваций",
  "холистический",
  "устойчивые экосистемы",
  "катализатор",
];

function highlightText(text) {
  const lowerText = text.toLowerCase();
  const parts = [];
  let cursor = 0;

  // Build list of match ranges
  const matches = [];
  for (const phrase of STERILE_PHRASES) {
    const lower = phrase.toLowerCase();
    let idx = lowerText.indexOf(lower, 0);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + phrase.length });
      idx = lowerText.indexOf(lower, idx + 1);
    }
  }

  // Sort and merge overlapping ranges
  matches.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const m of matches) {
    if (merged.length && m.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
    } else {
      merged.push({ ...m });
    }
  }

  // Build React fragments
  for (const { start, end } of merged) {
    if (cursor < start) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(
      <mark
        key={`${start}-${end}`}
        className="bg-amber-500/30 text-amber-300 rounded px-0.5 border-b border-amber-400/50"
        title="Клише / шаблонная фраза"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function AiBadge({ score }) {
  const color =
    score >= 70
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : score >= 40
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-green-400 bg-green-500/10 border-green-500/30";

  const label =
    score >= 70 ? "Высокий риск" : score >= 40 ? "Средний риск" : "Низкий риск";

  return (
    <span className={clsx("badge border text-xs font-bold", color)}>
      <Bot size={12} className="mr-1" />
      AI {label}: {Math.round(score)}%
    </span>
  );
}

function AuthenticityBadge({ score }) {
  const color =
    score >= 70
      ? "text-green-400 bg-green-500/10 border-green-500/30"
      : score >= 40
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-red-400 bg-red-500/10 border-red-500/30";

  return (
    <span className={clsx("badge border text-xs font-bold", color)}>
      <CheckCircle size={12} className="mr-1" />
      Аутентичность: {Math.round(score)}
    </span>
  );
}

export default function AuthenticityHighlight({ essayText, aiProbability, authenticityIndex }) {
  const isHighRisk = (aiProbability ?? 0) > 70;
  const paragraphs = (essayText || "").split(/\n+/).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-3">
        <AiBadge score={aiProbability ?? 0} />
        <AuthenticityBadge score={authenticityIndex ?? 0} />
      </div>

      {/* Warning banner for high AI probability */}
      {isHighRisk && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">
              Высокая вероятность AI-контента ({Math.round(aiProbability)}%)
            </p>
            <p className="text-red-300/70 text-xs mt-1">
              Текст эссе с высокой вероятностью сгенерирован или сильно отредактирован
              с помощью ИИ. Выделены клише и шаблонные фразы.
            </p>
          </div>
        </div>
      )}

      {/* Essay text with highlights */}
      <div className="bg-surface-300 border border-surface-400 rounded-xl p-5 space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-gray-300 text-sm leading-relaxed">
            {highlightText(para)}
          </p>
        ))}
        {paragraphs.length === 0 && (
          <p className="text-gray-500 text-sm italic">Текст эссе отсутствует.</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="inline-block w-3 h-3 rounded bg-amber-500/30 border-b border-amber-400/50" />
        <span>— выделены шаблонные фразы и клише</span>
      </div>
    </div>
  );
}

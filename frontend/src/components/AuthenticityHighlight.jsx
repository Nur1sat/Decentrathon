import React, { useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle, Bot, Cpu, Fingerprint, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

// ─── Fragment inline highlighting ───────────────────────────────────────────────

const FRAGMENT_STYLES = {
  ai_signal: {
    mark: "bg-red-500/25 text-red-200 border-b-2 border-red-500 rounded-sm px-0.5 cursor-help",
    badge: "bg-red-500/15 border-red-500/40 text-red-300",
    dot: "bg-red-500",
    textColor: "text-red-400",
    label: "AI-сигнал",
  },
  template: {
    mark: "bg-amber-500/25 text-amber-200 border-b-2 border-amber-400 rounded-sm px-0.5 cursor-help",
    badge: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    dot: "bg-amber-400",
    textColor: "text-amber-400",
    label: "Клише",
  },
  authentic: {
    mark: "bg-[#C1F11D]/20 text-green-200 border-b-2 border-[#C1F11D] rounded-sm px-0.5 cursor-help",
    badge: "bg-[#C1F11D]/15 border-[#C1F11D]/40 text-[#C1F11D]",
    dot: "bg-[#C1F11D]",
    textColor: "text-[#C1F11D]",
    label: "Живой голос",
  },
};

/**
 * Annotates `text` with React <mark> elements for each fragment.
 * Fragments may overlap; we merge by priority: ai_signal > template > authentic.
 */
function annotateText(text, fragments) {
  if (!fragments || fragments.length === 0) return [text];

  const PRIORITY = { ai_signal: 0, template: 1, authentic: 2 };

  // Build sorted list of [start, end, fragment] ranges
  const ranges = [];
  for (const frag of fragments) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(frag.quote.toLowerCase());
    if (idx === -1) continue;
    ranges.push({ start: idx, end: idx + frag.quote.length, frag });
  }
  ranges.sort((a, b) => a.start - b.start || PRIORITY[a.frag.type] - PRIORITY[b.frag.type]);

  // Merge overlaps (keep higher priority)
  const merged = [];
  for (const r of ranges) {
    if (merged.length && r.start < merged[merged.length - 1].end) {
      const prev = merged[merged.length - 1];
      if (PRIORITY[r.frag.type] < PRIORITY[prev.frag.type]) {
        merged[merged.length - 1] = { ...r, end: Math.max(r.end, prev.end) };
      }
    } else {
      merged.push(r);
    }
  }

  // Build React nodes
  const parts = [];
  let cursor = 0;
  for (const { start, end, frag } of merged) {
    if (cursor < start) parts.push(text.slice(cursor, start));
    const style = FRAGMENT_STYLES[frag.type] || FRAGMENT_STYLES.template;
    parts.push(
      <mark
        key={`${start}-${end}`}
        className={style.mark}
        title={`${style.label}: ${frag.reason}`}
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

// ─── Sub-score mini bar ─────────────────────────────────────────────────────────

function SubScore({ icon, label, value, color }) {
  const pct = Math.min(100, Math.max(0, value ?? 50));
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          {icon}
          {label}
        </span>
        <span className={clsx("text-xs font-bold tabular-nums", color)}>
          {Math.round(pct)}
        </span>
      </div>
      <div className="h-1 rounded-full bg-surface-400 overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color.replace("text-", "bg-"))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Fragments legend panel ─────────────────────────────────────────────────────

function FragmentPanel({ fragments }) {
  const [activeType, setActiveType] = useState(null);

  const types = ["ai_signal", "template", "authentic"];
  const counts = Object.fromEntries(
    types.map((t) => [t, fragments.filter((f) => f.type === t).length])
  );

  const visible = activeType
    ? fragments.filter((f) => f.type === activeType)
    : fragments;

  return (
    <div className="space-y-3">
      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => {
          const s = FRAGMENT_STYLES[t];
          if (!counts[t]) return null;
          return (
            <button
              key={t}
              onClick={() => setActiveType(activeType === t ? null : t)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
                activeType === t || activeType === null ? s.badge : "bg-surface-400 border-surface-400 text-gray-500"
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full", s.dot)} />
              {s.label}
              <span className="opacity-60">({counts[t]})</span>
            </button>
          );
        })}
        {activeType && (
          <button
            onClick={() => setActiveType(null)}
            className="text-xs text-gray-500 hover:text-gray-300 px-2"
          >
            сбросить
          </button>
        )}
      </div>

      {/* Fragment list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {visible.map((f, i) => {
          const s = FRAGMENT_STYLES[f.type] || FRAGMENT_STYLES.template;
          return (
            <div
              key={i}
              className={clsx(
                "rounded-lg border p-3 text-xs space-y-1",
                s.badge
              )}
            >
              <p className="font-mono text-[11px] leading-relaxed opacity-90">
                «{f.quote}»
              </p>
              <p className="opacity-70 leading-relaxed">{f.reason}</p>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-xs text-gray-600 italic">Нет фрагментов этого типа.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function AuthenticityHighlight({
  essayText,
  aiProbability,
  authenticityIndex,
  realityGrounding,
  personalExperience,
  originality,
  authenticityFragments,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighRisk = (aiProbability ?? 0) > 70;
  const paragraphs = (essayText || "").split(/\n+/).filter(Boolean);
  const fragments = authenticityFragments || [];

  const aiColor =
    (aiProbability ?? 0) >= 70
      ? "text-red-400"
      : (aiProbability ?? 0) >= 40
      ? "text-amber-400"
      : "text-primary";

  return (
    <div className="space-y-5">

      {/* ── Top: badges + sub-scores ── */}
      <div className="space-y-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold",
              (aiProbability ?? 0) >= 70
                ? "text-red-400 bg-red-500/10 border-red-500/30"
                : (aiProbability ?? 0) >= 40
                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                : "text-primary bg-primary/10 border-primary/30"
            )}
          >
            <Bot size={12} />
            AI-вероятность: {Math.round(aiProbability ?? 0)}%
          </span>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold",
              (authenticityIndex ?? 0) >= 70
                ? "text-primary bg-primary/10 border-primary/30"
                : (authenticityIndex ?? 0) >= 40
                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                : "text-red-400 bg-red-500/10 border-red-500/30"
            )}
          >
            <Fingerprint size={12} />
            Аутентичность: {Math.round(authenticityIndex ?? 0)}
          </span>
        </div>

        {/* Three sub-axes */}
        {(realityGrounding != null || personalExperience != null || originality != null) && (
          <div className="flex gap-4 flex-wrap">
            <SubScore
              icon={<Cpu size={11} />}
              label="Связь с реальностью"
              value={realityGrounding ?? 50}
              color="text-cyan-400"
            />
            <SubScore
              icon={<Sparkles size={11} />}
              label="Личный опыт"
              value={personalExperience ?? 50}
              color="text-violet-400"
            />
            <SubScore
              icon={<CheckCircle size={11} />}
              label="Оригинальность"
              value={originality ?? 50}
              color="text-primary"
            />
          </div>
        )}
      </div>

      {/* ── Warning banner ── */}
      {isHighRisk && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">
              Высокая вероятность AI-контента ({Math.round(aiProbability)}%)
            </p>
            <p className="text-red-300/70 text-xs mt-1">
              Подсвечены фрагменты, которые система расценила как AI-сигналы или клише.
              Финальное решение остаётся за экспертом.
            </p>
          </div>
        </div>
      )}

      {/* ── Essay with inline highlights ── */}
      <div className="relative">
        <div className={clsx(
          "bg-surface-300 border border-surface-400 rounded-xl p-5 space-y-4 overflow-hidden transition-all duration-300 ease-in-out",
          !isExpanded && "max-h-[320px]"
        )}>
          {paragraphs.map((para, i) => (
            <p key={i} className="text-gray-300 text-sm leading-relaxed">
              {annotateText(para, fragments)}
            </p>
          ))}
          {paragraphs.length === 0 && (
            <p className="text-gray-500 text-sm italic">Текст эссе отсутствует.</p>
          )}
        </div>
        
        {essayText?.length > 500 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#C1F11D] hover:bg-[#C1F11D]/10 px-3 py-1.5 rounded-lg border border-[#C1F11D]/20 transition-all shadow-lg"
          >
            {isExpanded ? (
              <> <ChevronUp size={14} /> Свернуть </>
            ) : (
              <> <ChevronDown size={14} /> Развернуть всё эссе </>
            )}
          </button>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {Object.entries(FRAGMENT_STYLES).map(([type, s]) => (
          <span key={type} className={clsx("flex items-center gap-1.5", s.textColor)}>
            <span className={clsx("inline-block w-3 h-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        ))}
      </div>

      {/* ── Fragment analysis panel ── */}
      {fragments.length > 0 && (
        <div className="border border-surface-400 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Разбор фрагментов ({fragments.length})
          </h3>
          <FragmentPanel fragments={fragments} />
        </div>
      )}
    </div>
  );
}

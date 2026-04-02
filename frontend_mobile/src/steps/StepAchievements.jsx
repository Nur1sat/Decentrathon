import React, { useState } from "react";
import { Trophy, ArrowRight, ArrowLeft } from "lucide-react";

const HINTS = [
  "Олимпиады и их уровень (школьный / городской / региональный / республиканский)",
  "Проекты: что сделали, на кого повлияло",
  "Волонтёрство и социальные инициативы",
  "Награды, гранты, сертификаты",
  "Спорт, творчество, хобби — если есть значимые результаты",
];

export default function StepAchievements({ form, update, onNext, onBack }) {
  const [error, setError] = useState("");
  const charCount = form.achievements_text.length;

  const handleNext = () => {
    if (charCount < 50) {
      setError("Пожалуйста, опишите достижения подробнее (минимум 50 символов)");
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          <Trophy size={20} className="inline mr-2 text-primary-400" />
          Достижения
        </h2>
        <p className="text-sm text-gray-500">
          Расскажите о своих успехах. Пишите конкретно: чем точнее детали —
          тем точнее оценка.
        </p>
      </div>

      {/* Hints */}
      <div className="card p-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Что можно указать:
        </p>
        {HINTS.map((h, i) => (
          <p key={i} className="text-xs text-gray-500 flex items-start gap-2">
            <span className="text-primary-400 font-bold mt-0.5">·</span>
            {h}
          </p>
        ))}
      </div>

      <div>
        <textarea
          className={`input-field ${error ? "border-red-500" : ""}`}
          placeholder={"Пример:\n• 3-е место на республиканской олимпиаде по математике (2024)\n• Организовал субботник в своём дворе, привлёк 40 соседей\n• Веду YouTube-канал о программировании (1200 подписчиков)"}
          rows={7}
          value={form.achievements_text}
          onChange={(e) => {
            update({ achievements_text: e.target.value });
            setError("");
          }}
        />
        <div className="flex justify-between mt-1">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${charCount < 50 ? "text-gray-600" : "text-gray-400"}`}>
            {charCount} символов
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-shrink-0 w-auto px-5" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Продолжить <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

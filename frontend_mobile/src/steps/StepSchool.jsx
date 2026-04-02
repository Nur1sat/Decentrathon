import React from "react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";

const SCHOOL_OPTIONS = [
  {
    value: "elite",
    emoji: "🏛",
    title: "Элитная / специализированная",
    desc: "НИШ, Назарбаев Интеллектуальные школы, спецшколы с углублёнными программами",
  },
  {
    value: "regular",
    emoji: "🏫",
    title: "Обычная городская",
    desc: "Стандартная городская общеобразовательная школа",
  },
  {
    value: "rural",
    emoji: "🌾",
    title: "Сельская школа",
    desc: "Школа в сельской местности или малом городе",
  },
];

export default function StepSchool({ form, update, onNext, onBack }) {
  const selected = form.school_type;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Тип школы</h2>
        <p className="text-sm text-gray-500">
          Это важно: кандидат из сельской школы с теми же достижениями
          демонстрирует больший потенциал. Система учитывает ваш контекст.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SCHOOL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update({ school_type: opt.value })}
            className={`card p-4 text-left flex items-start gap-3 transition-all duration-150 ${
              selected === opt.value
                ? "border-primary-500 bg-surface-300"
                : "hover:border-surface-400 hover:bg-surface-300"
            }`}
          >
            <span className="text-2xl flex-shrink-0 mt-0.5">{opt.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{opt.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            </div>
            {selected === opt.value && (
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <button className="btn-secondary flex-shrink-0 w-auto px-5" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!selected}
        >
          Продолжить <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

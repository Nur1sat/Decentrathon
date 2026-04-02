import React, { useState } from "react";
import { FileText, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react";

const PROMPTS = [
  "Почему именно inDrive University?",
  "Какую проблему вы хотите решить в будущем?",
  "Расскажите о моменте, когда вы поняли, чем хотите заниматься.",
  "Что отличает вас от других кандидатов?",
];

export default function StepEssay({ form, update, onNext, onBack }) {
  const [error, setError] = useState("");
  const [activePrompt, setActivePrompt] = useState(null);
  const charCount = form.essay_text.length;

  const handleNext = () => {
    if (charCount < 100) {
      setError("Пожалуйста, напишите эссе подробнее (минимум 100 символов)");
      return;
    }
    onNext();
  };

  const appendPrompt = (p) => {
    const prefix = form.essay_text ? form.essay_text + "\n\n" : "";
    update({ essay_text: prefix + p + " " });
    setActivePrompt(p);
    setError("");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">
          <FileText size={20} className="inline mr-2 text-primary-400" />
          Мотивационное эссе
        </h2>
        <p className="text-sm text-gray-500">
          Нам важен ваш настоящий голос. Пишите так, как говорите — без
          шаблонов и корпоративного языка.
        </p>
      </div>

      {/* Prompt chips */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Lightbulb size={11} />
          Подсказки (нажмите, чтобы добавить в текст):
        </p>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => appendPrompt(p)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                activePrompt === p
                  ? "border-primary-500 bg-primary-600/20 text-primary-400"
                  : "border-surface-400 bg-surface-300 text-gray-400 hover:border-primary-500 hover:text-primary-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          className={`input-field ${error ? "border-red-500" : ""}`}
          placeholder="Расскажите о себе своими словами. Конкретные истории и детали ценятся больше, чем общие фразы."
          rows={9}
          value={form.essay_text}
          onChange={(e) => {
            update({ essay_text: e.target.value });
            setError("");
            setActivePrompt(null);
          }}
        />
        <div className="flex justify-between mt-1">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${charCount < 100 ? "text-gray-600" : "text-green-500"}`}>
            {charCount} символов {charCount >= 100 ? "✓" : `/ мин. 100`}
          </p>
        </div>
      </div>

      <div className="card p-3 flex items-start gap-2">
        <span className="text-lg">🔍</span>
        <p className="text-xs text-gray-500">
          Система автоматически проверяет аутентичность текста.
          Эссе, написанное вами, всегда ценится выше сгенерированного ИИ.
        </p>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-shrink-0 w-auto px-5" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Проверить заявку <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

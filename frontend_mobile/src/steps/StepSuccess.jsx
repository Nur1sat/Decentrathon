import React, { useState } from "react";
import { CheckCircle, Copy, Check, RotateCcw } from "lucide-react";

export default function StepSuccess({ ref_, onRestart }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref_);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center gap-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
        <CheckCircle size={40} className="text-green-400" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Заявка принята!</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Ваша заявка поступила в приёмную комиссию inDrive University.
          Сохраните номер заявки — он понадобится для отслеживания статуса.
        </p>
      </div>

      {/* Application ref */}
      <div className="bg-surface-300 border border-surface-400 rounded-2xl p-5 w-full max-w-xs">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
          Номер заявки
        </p>
        <p className="text-xl font-mono font-bold text-primary-400 tracking-widest mb-4">
          {ref_}
        </p>
        <button
          onClick={copy}
          className="btn-secondary py-2.5 text-sm"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" /> Скопировано
            </>
          ) : (
            <>
              <Copy size={14} /> Скопировать
            </>
          )}
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-500 max-w-xs">
        <p>📬 Ожидайте сообщения от комиссии после завершения отбора.</p>
        <p>⏱ Анализ занимает 5–10 рабочих дней.</p>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mt-2"
      >
        <RotateCcw size={14} />
        Подать другую заявку
      </button>
    </div>
  );
}

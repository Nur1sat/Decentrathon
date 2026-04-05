import React, { useState } from "react";
import { ArrowLeft, Send, Loader2, ShieldCheck } from "lucide-react";

const SCHOOL_LABELS = {
  elite: "Элитная / специализированная",
  regular: "Обычная городская",
  rural: "Сельская школа",
};

function ReviewField({ label, value }) {
  return (
    <div className="py-3 border-b border-surface-400 last:border-0">
      <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-200 whitespace-pre-line break-words">
        {value || "—"}
      </p>
    </div>
  );
}

export default function StepReview({ form, onBack, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const tgChatId = params.get("chat_id") || null;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
      const resp = await fetch(`${backendUrl}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          city: form.city,
          school_type: form.school_type,
          essay_text: form.essay_text,
          tg_chat_id: tgChatId,
          source: "telegram_webapp",
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data.detail || "Ошибка отправки. Попробуйте ещё раз.");
        return;
      }
      const data = await resp.json();
      onSuccess(data.id);
    } catch (e) {
      setError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  const essayPreview = form.essay_text.length > 300
    ? form.essay_text.slice(0, 300) + "…"
    : form.essay_text;
  const achPreview = form.achievements_text.length > 300
    ? form.achievements_text.slice(0, 300) + "…"
    : form.achievements_text;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Проверьте заявку</h2>
        <p className="text-sm text-gray-500">
          Убедитесь, что все данные верны, и нажмите «Отправить».
        </p>
      </div>

      <div className="card px-4 py-1">
        <ReviewField label="Полное имя" value={form.full_name} />
        <ReviewField label="Возраст" value={`${form.age} лет`} />
        <ReviewField label="Город" value={form.city} />
        <ReviewField label="Тип школы" value={SCHOOL_LABELS[form.school_type]} />
        <ReviewField label="Достижения" value={achPreview} />
        <ReviewField label="Эссе" value={essayPreview} />
      </div>

      <div className="card p-3 flex items-start gap-2">
        <ShieldCheck size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Ваше имя будет обезличено перед анализом. Реальные данные
          хранятся в зашифрованной базе и доступны только уполномоченным
          сотрудникам приёмной комиссии.
        </p>
      </div>

      {error && (
        <div className="card border-red-500/50 bg-red-900/10 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="btn-secondary flex-shrink-0 w-auto px-5"
          onClick={onBack}
          disabled={submitting}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Отправляю…
            </>
          ) : (
            <>
              <Send size={16} />
              Отправить заявку
            </>
          )}
        </button>
      </div>
    </div>
  );
}

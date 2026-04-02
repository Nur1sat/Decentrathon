import React, { useState } from "react";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, Loader2 } from "lucide-react";
import { submitFeedback } from "../api/client.js";

export default function FeedbackButton({ candidateId }) {
  const [choice, setChoice] = useState(null); // null | true | false
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChoose = (agreed) => {
    if (submitted) return;
    setChoice(agreed);
    setError(null);
  };

  const handleSubmit = async () => {
    if (choice === null || loading || submitted) return;
    setLoading(true);
    setError(null);
    try {
      await submitFeedback(candidateId, {
        agreed: choice,
        comment: comment.trim() || null,
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.message || "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
        <div>
          <p className="text-green-400 font-semibold text-sm">Обратная связь получена</p>
          <p className="text-green-300/60 text-xs mt-0.5">
            {choice ? "Вы согласились с оценкой ИИ" : "Вы не согласились с оценкой ИИ"}
            {comment ? ` — «${comment}»` : ""}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-gray-200 mb-1">Human-in-the-loop оценка</p>
        <p className="text-xs text-gray-500">Согласны ли вы с оценкой ИИ по данному кандидату?</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleChoose(true)}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all duration-200",
            choice === true
              ? "bg-green-500/20 border-green-500 text-green-400"
              : "bg-surface-300 border-surface-400 text-gray-400 hover:border-green-500/50 hover:text-green-400"
          )}
        >
          <ThumbsUp size={15} />
          Согласен с ИИ
        </button>
        <button
          onClick={() => handleChoose(false)}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all duration-200",
            choice === false
              ? "bg-red-500/20 border-red-500 text-red-400"
              : "bg-surface-300 border-surface-400 text-gray-400 hover:border-red-500/50 hover:text-red-400"
          )}
        >
          <ThumbsDown size={15} />
          Не согласен
        </button>
      </div>

      {choice !== null && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Необязательный комментарий..."
            rows={2}
            className="w-full bg-surface-300 border border-surface-400 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
          />
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary justify-center py-2.5"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {loading ? "Отправка..." : "Отправить оценку"}
          </button>
        </div>
      )}
    </div>
  );
}
